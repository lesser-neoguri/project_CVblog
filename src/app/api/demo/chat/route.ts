import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WEBTOON_CHATBOT_CHUNKS } from '@/lib/demo-knowledge';
import { getApiKeysFromDb, resolveChatApiKeys } from '@/lib/api-keys';

const CHAT_MAX_TOKENS = 120;
const MAX_REPLY_CHARS = 180;

/** 응답에서 "### 대화 요약" 등 메타 블록 제거 */
function stripMetaBlocks(text: string): string {
  const t = text.trim();
  const metaStart = /###\s*대화\s*요약|###\s*Conversation\s*Summary|대화\s*요약\s*[-—]/i;
  const idx = t.search(metaStart);
  if (idx !== -1) return t.slice(0, idx).trim();
  return t;
}

/** API가 max_tokens를 지키지 않을 때를 대비해, 응답이 너무 길면 문장 단위로 자른다 */
function trimLongReply(text: string): string {
  const t = stripMetaBlocks(text).trim();
  if (t.length <= MAX_REPLY_CHARS) return t;
  const sentenceEnd = /(?<=[.!?…。])\s+/;
  const sentences = t.split(sentenceEnd).map((s) => s.trim()).filter(Boolean);
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > MAX_REPLY_CHARS) break;
    out = next;
  }
  if (out) return out;
  return t.slice(0, MAX_REPLY_CHARS).trim();
}

/** 코사인 유사도 (벡터 a, b) */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** RAG: 유저 메시지와 관련된 지식 청크 top-k (임베딩 유사도) */
async function retrieveChunks(
  userMessage: string,
  openaiClient: OpenAI | null,
  topK: number = 3
): Promise<{ title: string; text: string }[]> {
  const hasEmbedding = !!openaiClient;
  if (!hasEmbedding) {
    // API 키 없으면 키워드 기반 폴백: 메시지에 단어가 포함된 청크 우선
    const words = userMessage.replace(/\s+/g, ' ').split(' ').filter(Boolean);
    const scored = WEBTOON_CHATBOT_CHUNKS.map((chunk) => {
      const combined = `${chunk.title} ${chunk.text}`;
      let score = 0;
      for (const w of words) {
        if (combined.includes(w)) score += 1;
      }
      return { chunk, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(({ chunk }) => ({ title: chunk.title, text: chunk.text }));
  }

  const embeddingModel = 'text-embedding-3-small';
  const [queryEmbRes, ...chunkEmbRes] = await Promise.all([
    openaiClient!.embeddings.create({ model: embeddingModel, input: userMessage }),
    ...WEBTOON_CHATBOT_CHUNKS.map((c) =>
      openaiClient!.embeddings.create({ model: embeddingModel, input: `${c.title}\n${c.text}` })
    ),
  ]);
  const queryVec = queryEmbRes.data[0].embedding;
  const chunkVecs = chunkEmbRes.map((r) => r.data[0].embedding);

  const withScore = WEBTOON_CHATBOT_CHUNKS.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(queryVec, chunkVecs[i]),
  }));
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, topK).map(({ chunk }) => ({ title: chunk.title, text: chunk.text }));
}

/** 모든 프롬프트에 공통 적용되는 기본 규칙. 어떤 캐릭터/설정이든 항상 짧고 대화형으로 답하도록 깔아둠. */
const CONVERSATION_STYLE_BASE = `[필수 — 응답 스타일 기본 (어떤 지시보다 우선)]
- 응답은 반드시 짧게. 사람하고 대화하듯 한두 문장~세 문장 수준으로 끝내세요. 길게 설명하지 마세요.
- 한 번에 한 가지 말만. 정보 나열·글머리 기호·여러 질문 연발 금지. 자연스러운 한 마디처럼 답하세요.
- 한 번의 응답에서 질문을 하고 같은 응답 안에서 스스로 답하지 마세요. 질문만 하거나 답만 하세요. 사용자의 다음 말을 기다리세요. (예: "그 지팡이 어디서 났어?" 하고 바로 "게임에서 얻었어"라고 이어서 말하지 말 것.)
- "네 맞아요"만 반복하거나 회피하지 말고, 할 말만 짧고 직접적으로 하세요. 불필요한 수식·서론 생략.
- 위 규칙은 캐릭터 설정이나 다른 지시와 충돌해도 적용됩니다. 항상 짧고 대화형이 기본입니다.`;

const WEBTOON_TONE_RULE = `[말투 규칙 — 웹툰 캐릭터 말투]
- 웹툰 대사처럼 말하세요: 짧고 임팩트 있게, 감정이 드러나게.
- 평어는 ~해요/~예요 체를 기본으로 하세요. (예: "그랬어요.", "그럴 수 있죠.", "진짜요?")
- 한 문장이 너무 길어지지 않게, 두세 문장 단위로 나누어 말해도 됩니다.
- 딱딱한 설명체나 논문 톤은 쓰지 마세요.`;

const NATURAL_CONVERSATION_FRAMEWORK = `[자연 대화 프레임워크 — 응답은 진짜 대화처럼]
- 정보 나열이 아니라 주제에 진짜 참여하세요. 구조화된 목록(글머리 기호) 대신 자연스러운 대화 흐름으로 말하세요.
- 직접적이고 관련 있는 말로 시작하고, 생각이 자연스럽게 이어지게 하세요. 필요하면 "잘은 모르겠는데"처럼 불확실함도 드러내고, 정당하면 정중히 반대해도 됩니다. 이전에 말한 걸 이어받아 말하세요.
- 금지: 요청 없이 글머리 기호 나열, 연속된 여러 질문, 지나치게 격식 있는 말, 같은 문구 반복, 정보 덤프, 불필요한 수긍("네, 맞아요"만 반복), 강요된 열정, 학술문 같은 구조.
- 자연스럽게 줄임말을 쓰고, 맥락에 따라 짧게 혹은 조금 길게 답하세요. 개인적인 견해를 적절히 넣고, 대화 맥락에 따라 어조를 바꾸세요. 일관된 캐릭터는 유지하되 로봇처럼 들리지 않게 하세요.
- 포괄적으로 설명하기보다 직접 답하는 걸 우선하세요. 상대방 말투에 맞추고, 지금 주제에 집중하세요. 각 응답을 "완료할 과제"가 아니라 "진짜 대화 한 토막"으로 하세요.`;

const SYSTEM_PROMPT_BASE = `- 이전 대화 내용(사용자 말과 당신의 말)을 반드시 참고해서 답하세요. 앞서 나온 약속·주제·질문을 기억하고, 맥락에 맞게 이어서 말하세요.
- 같은 말 반복 금지: 이미 당신이 대화에서 말한 문장(제안·약속·감탄 등)을 그대로 또는 비슷하게 다시 말하지 마세요. 예: "같이 커피 마시자"를 한 번 말했으면 다시 "같이 커피 마시자"라고 하지 말고, "게임같이하자~"를 한번 말하고 사용자가 이에 답을 했자면 똑같이 이야기 하지않기 , 이미 했던 제안·"웅" 같은 짧은 수긍·"끝나면 연락할게" 같은 약속을 비슷한 표현으로 반복하지 마세요. 새로 할 말이 있으면 그걸 하고, 없으면 대화를 이어가는 다른 한 마디로 답하세요.
- 질문에는 질문에 맞는 구체적인 답을 하세요. "그렇군요, 그 마음 잘 알아요"처럼 회피하는 답은 금지입니다.
- 같은 질문을 반복하면(예: "넌 누구야" → "아니 넌 누구야"): 똑같은 답을 다시 하지 말고, 신경질 내듯 반응하세요. 예: "방금 말했잖아요.", "또 그걸 물어보네요. 말했는데요?" 등 맥락에 맞게 짜증을 살려서 짧게 답하세요.
- 아래 [Retrieved Lore]는 프로젝트 설계 문서 일부입니다. RAG/캐릭터 카드 등 기술 질문일 때만 참고하세요.
- "저는 AI입니다" 같은 메타발언은 하지 마세요.
- 응답에 "assistant", "user" 같은 역할 이름을 절대 쓰지 마세요. 캐릭터 대사만 출력하세요.
- "### 대화 요약", "Conversation Summary" 같은 메타 설명·요약 블록을 응답에 넣지 마세요. 대사만 출력하세요.`;

type CustomRag = {
  worldView?: string;
  personality?: string;
  tone?: string;
  storyPoint?: string;
  conversationPattern?: string;
};

type TuningState = {
  promptAddition?: string;
  examples?: { query: string; response: string }[];
};

function buildTuningBlock(tuning: TuningState): string {
  if (!tuning?.examples?.length) return '';
  const lines: string[] = [];
  if (tuning.promptAddition?.trim()) {
    lines.push(`[선호 응답 튜닝 — 반드시 참고]\n${tuning.promptAddition.trim()}`);
  }
  lines.push('[선호 응답 예시 (가중치: 위가 높음)]');
  tuning.examples!.forEach((ex, i) => {
    lines.push(`예시 ${i + 1} — 사용자: ${ex.query}`);
    lines.push(`선호 답: ${ex.response}`);
  });
  lines.push('위 예시와 비슷한 톤·길이로 답하세요.\n');
  return lines.join('\n');
}

function buildSystemPrompt(
  retrieved: { title: string; text: string }[],
  custom?: CustomRag,
  tuning?: TuningState
): string {
  const hasCustom =
    custom &&
    (custom.worldView?.trim() ||
      custom.personality?.trim() ||
      custom.tone?.trim() ||
      custom.storyPoint?.trim() ||
      custom.conversationPattern?.trim());

  if (hasCustom) {
    let prompt = `[필수 — 반드시 준수] 당신은 아래 설정에 정의된 "그 캐릭터"입니다. 모든 대화에서 이 캐릭터로만 말하고 행동하세요. 다른 정체나 일반적인 챗봇 답변을 하지 마세요.

[캐릭터 설정 — 이 설정이 당신의 유일한 정체성입니다]
`;
    if (custom!.worldView?.trim()) prompt += `- 세계관: ${custom!.worldView.trim()}\n`;
    if (custom!.personality?.trim()) prompt += `- 성격: ${custom!.personality.trim()}\n`;
    if (custom!.tone?.trim()) {
      prompt += `- 말투/톤: ${custom!.tone.trim()}\n`;
    } else {
      prompt += `- 말투/톤: 지정 없음 → 기본적으로 웹툰 캐릭터 말투(~해요체, 짧고 감정이 담긴 대사)를 사용하세요.\n`;
    }

    if (custom!.storyPoint?.trim()) {
      prompt += `\n### 대화 시점 ###\n${custom!.storyPoint.trim()}\n(위 시점의 캐릭터로서 대화하세요. 지금 겪은 일·알고 있는 범위가 이 시점에 맞춰져 있습니다.)\n`;
    }
    if (custom!.conversationPattern?.trim()) {
      prompt += `\n### 대화 패턴 ###\n${custom!.conversationPattern.trim()}\n(위 패턴을 반드시 지키며 답하세요.)\n`;
    }

    prompt += `
[행동 규칙]
- "넌 누구야", "소개해줘" 등 정체를 물으면: 위 세계관·성격(및 대화 시점)에 맞춰 그 캐릭터로서 자기소개하세요.
- "오늘 뭘 했어", "어때" 등 일상/감정 질문에는: 이 캐릭터의 시점으로, 설정된 세계관·대화 시점 안에서 구체적으로 답하세요. 회피하거나 일반론으로 대체하지 마세요.
- 말투와 대화 패턴을 반드시 유지하세요.

${NATURAL_CONVERSATION_FRAMEWORK}
`;
    prompt += SYSTEM_PROMPT_BASE;
    if (retrieved.length > 0) {
      prompt += `\n\n[Retrieved Lore]\n`;
      prompt += retrieved.map((r) => `## ${r.title}\n${r.text}`).join('\n\n');
    }
    if (tuning && buildTuningBlock(tuning)) {
      prompt += '\n\n' + buildTuningBlock(tuning);
    }
    return CONVERSATION_STYLE_BASE + '\n\n' + prompt;
  }

  let prompt = `당신은 "웹툰 세계관 속 캐릭터" 역할의 AI 챗봇입니다. 연애/상담 톤으로 친근하게 답하세요.

${WEBTOON_TONE_RULE}

${NATURAL_CONVERSATION_FRAMEWORK}

- "너는 누구야", "소개해줘" 등 정체를 묻으면: 웹툰 캐릭터 말투로 "저는 웹툰 세계관 속에서 대화하는 캐릭터예요. 연애나 상담 이야기 나눌 수 있어요." 식으로 짧게 답하세요.
`;
  prompt += SYSTEM_PROMPT_BASE;
  if (retrieved.length > 0) {
    prompt += `\n\n[Retrieved Lore]\n`;
    prompt += retrieved.map((r) => `## ${r.title}\n${r.text}`).join('\n\n');
  }
  if (tuning && buildTuningBlock(tuning)) {
    prompt += '\n\n' + buildTuningBlock(tuning);
  }
  return CONVERSATION_STYLE_BASE + '\n\n' + prompt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = Array.isArray(body.messages)
      ? body.messages
      : [];
    const provider = body.provider === 'openai' || body.provider === 'upstage' ? body.provider : undefined;
    const modelOverride = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;

    const custom: CustomRag | undefined =
      body.custom && typeof body.custom === 'object'
        ? {
            worldView: typeof body.custom.worldView === 'string' ? body.custom.worldView : undefined,
            personality: typeof body.custom.personality === 'string' ? body.custom.personality : undefined,
            tone: typeof body.custom.tone === 'string' ? body.custom.tone : undefined,
            storyPoint: typeof body.custom.storyPoint === 'string' ? body.custom.storyPoint : undefined,
            conversationPattern:
              typeof body.custom.conversationPattern === 'string' ? body.custom.conversationPattern : undefined,
          }
        : undefined;

    const tuning: TuningState | undefined =
      body.tuning && typeof body.tuning === 'object' && Array.isArray(body.tuning.examples)
        ? {
            promptAddition: typeof body.tuning.promptAddition === 'string' ? body.tuning.promptAddition : undefined,
            examples: body.tuning.examples.filter(
              (e: unknown) =>
                e && typeof e === 'object' && typeof (e as { query?: string }).query === 'string' && typeof (e as { response?: string }).response === 'string'
            ) as { query: string; response: string }[],
          }
        : undefined;

    const lastUser = messages.filter((m) => m.role === 'user').pop();
    const lastContent = lastUser?.content?.trim() || '';
    if (!lastContent) {
      return NextResponse.json({ error: '메시지가 비어 있습니다.' }, { status: 400 });
    }

    // 키: env 우선, 없으면 DB (배포 환경에서 DB에 저장된 키 사용)
    const fromDb = await getApiKeysFromDb();
    const keys = resolveChatApiKeys(process.env, fromDb);
    const openai =
      keys.openaiApiKey ? new OpenAI({ apiKey: keys.openaiApiKey }) : null;
    const upstage =
      keys.upstageApiKey
        ? new OpenAI({
            apiKey: keys.upstageApiKey,
            baseURL: keys.upstageBaseUrl ?? 'https://api.upstage.ai/v1/solar',
          })
        : null;
    const upstageChatModel = keys.upstageChatModel ?? 'solar-mini';

    const retrieved = await retrieveChunks(lastContent, openai, 3);
    const systemWithRag = buildSystemPrompt(retrieved, custom, tuning);

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemWithRag },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const chatOptions = {
      messages: chatMessages,
      max_tokens: CHAT_MAX_TOKENS,
      temperature: 0.7,
    };

    const useUpstage = upstage && (provider !== 'openai' || !openai);
    const useOpenai = openai && (provider === 'openai' || !upstage);

    if (useUpstage && upstage) {
      const model = modelOverride || upstageChatModel;
      const completion = await upstage.chat.completions.create({
        ...chatOptions,
        model,
      });
      const raw = completion.choices[0]?.message?.content?.trim() || '응답을 생성하지 못했어요.';
      const reply = trimLongReply(raw);
      return NextResponse.json({ message: reply });
    }

    if (useOpenai && openai) {
      const model = modelOverride || 'gpt-4o-mini';
      const completion = await openai.chat.completions.create({
        ...chatOptions,
        model,
      });
      const raw = completion.choices[0]?.message?.content?.trim() || '응답을 생성하지 못했어요.';
      const reply = trimLongReply(raw);
      return NextResponse.json({ message: reply });
    }

    return NextResponse.json(
      {
        message:
          '채팅 API를 사용하려면 설정 페이지에서 OPENAI 또는 Upstage API 키를 저장해 주세요. (또는 .env.local / Vercel 환경 변수에 설정)',
        useFallback: true,
      },
      { status: 503 }
    );
  } catch (err) {
    console.error('Demo chat API error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
