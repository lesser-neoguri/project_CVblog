import type OpenAI from 'openai';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'you', 'your', 'what', 'when',
  'where', 'which', 'how', 'why', 'are', 'was', 'were', 'been', 'will', 'would', 'can', 'could',
  '좀', '그냥', '근데', '그리고', '그러면', '그래서', '있는', '없는', '하는', '해서', '이거', '저거',
  '그거', '이건', '저건', '그건', '제가', '나는', '너는', '우리', '진짜', '약간', '일단', '이제',
]);

function cleanText(t: string): string {
  return t.replace(/\s+/g, ' ').trim();
}

function detectDetailPreference(userText: string): 'short' | 'long' | null {
  const t = userText.toLowerCase();
  if (/간단|짧게|요약|한줄|핵심만|짧게만|대충|요점/.test(t)) return 'short';
  if (/자세히|자세하게|구체|깊게|디테일|예시|길게|천천히|세세|상세|풀어|나눠/.test(t)) return 'long';
  return null;
}

function detectUserTone(messages: ChatMessage[]): 'formal' | 'casual' {
  const users = messages.filter((m) => m.role === 'user').slice(-4);
  const joined = users.map((m) => m.content).join(' ');
  const formalScore = (joined.match(/요\b|니다\b|해요\b|해주세요\b/g) || []).length;
  const casualScore = (joined.match(/야\b|해줘\b|ㄱ|ㅋㅋ|ㅎ{2,}/g) || []).length;
  return formalScore >= casualScore ? 'formal' : 'casual';
}

function chooseVariationStyle(userText: string): 'reaction-first' | 'event-first' | 'scene-first' {
  const sum = Array.from(userText).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = sum % 3;
  if (idx === 0) return 'reaction-first';
  if (idx === 1) return 'event-first';
  return 'scene-first';
}

function extractKeywords(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  return Array.from(new Set(raw)).slice(0, 14);
}

function detectStoryIntent(userText: string): boolean {
  const t = userText.toLowerCase();
  return /이야기|썰|일대기|모험|에피소드|풀어|들려|연재|상황극/.test(t);
}

function detectContinueIntent(userText: string): boolean {
  const t = userText.toLowerCase();
  return /계속|이어|다음|더 말해|그 뒤|그다음|계속 말해|이어서|뒤 이야기|continue/.test(t);
}

function detectChunkIntent(userText: string): boolean {
  const t = userText.toLowerCase();
  return /끊어서|나눠서|한줄씩|줄마다|토막|분할|짧게 끊어/.test(t);
}

function detectPauseIntent(userText: string): boolean {
  const t = userText.toLowerCase();
  return /잠만|잠깐|기다려|화장실|다녀올게|잠시만|기다려줘|잠수|hold on|brb/.test(t);
}

function detectMinimalTurn(userText: string): boolean {
  const t = userText.trim().toLowerCase();
  return t.length <= 6 || /^(안녕|하이|ㅎㅇ|뭐해|ㅇㅇ|ㅇㅋ|ok|hey)$/.test(t);
}

function detectRoughTone(userText: string): boolean {
  const t = userText.toLowerCase();
  return /헛소리|짜증|빡치|개짜증|닥쳐|뭐하냐|어이없|열받|씨발|시발|fuck/.test(t);
}

function detectWaitOnlyIntent(userText: string): boolean {
  const t = userText.toLowerCase();
  return /기다려|잠깐|잠시만|다녀올게|화장실/.test(t) && !/계속|이어|말해|더/.test(t);
}
function worldLoreHints(contextText: string): string[] {
  const t = contextText.toLowerCase();
  if (/길드|퀘스트|히든|랭커|던전|클래스|크로노|게임/.test(t)) {
    return [
      'Use MMORPG logic: guild politics, hidden classes, quest consequences, market rumors.',
      'Stories should include plausible in-game mechanics and social reactions from users.',
    ];
  }
  if (/마교|무림|맹주|현경|절정|내공|강호|문파/.test(t)) {
    return [
      'Use murim logic: sect conflicts, rank hierarchy, martial stages, honor/debt dynamics.',
      'Keep terms consistent with wuxia power systems and faction etiquette.',
    ];
  }
  if (/9서클|드래곤|황제|기사|마법|신격|성역|제국/.test(t)) {
    return [
      'Use high-fantasy logic: magic tiers, oaths, bloodline relics, imperial power struggles.',
      'Balance wonder with grounded consequences and character motives.',
    ];
  }
  return [
    'Keep world rules consistent and avoid modern real-world causality that breaks immersion.',
    'Prioritize concrete events and believable motives over vague exposition.',
  ];
}

export function getQuickIntentReply(userText: string): string | null {
  if (!detectPauseIntent(userText)) return null;
  if (/계속|이어|말해줘|keep/.test(userText.toLowerCase())) {
    return '어어 알겠어. 그럼 이어서 말하면, 그때부터 판이 완전히 뒤집혔어.';
  }
  if (detectWaitOnlyIntent(userText)) return '응, 갔다와. 여기서 기다리고 있을게.';
  return '알겠어. 끊지 말고 그대로 이어서 말해볼게.';
}

export function buildAdaptivePromptBlock(messages: ChatMessage[]): string {
  const recentUsers = messages.filter((m) => m.role === 'user').slice(-3);
  const recentAssistants = messages.filter((m) => m.role === 'assistant').slice(-3);
  const lastUser = recentUsers[recentUsers.length - 1]?.content ?? '';
  const tone = detectUserTone(messages);
  const detail = detectDetailPreference(lastUser);
  const questionCount = (lastUser.match(/\?/g) || []).length;
  const userSeemsEmotional = /불안|걱정|답답|스트레스|힘들|짜증|외롭|슬프/.test(lastUser);
  const storyIntent = detectStoryIntent(lastUser);
  const continueIntent = detectContinueIntent(lastUser);
  const chunkIntent = detectChunkIntent(lastUser);
  const pauseIntent = detectPauseIntent(lastUser);
  const minimalTurn = detectMinimalTurn(lastUser);
  const roughTone = detectRoughTone(lastUser);
  const variationStyle = chooseVariationStyle(lastUser);
  const loreHints = worldLoreHints(
    `${lastUser} ${recentUsers.map((u) => u.content).join(' ')}`
  );

  const bannedOpeners = recentAssistants
    .map((m) => cleanText(m.content).split(/[.!?\n]/)[0] ?? '')
    .map((s) => s.slice(0, 28))
    .filter(Boolean)
    .slice(-2);

  const lines: string[] = [];
  lines.push('[Adaptive Conversation Policy]');
  lines.push('- Match the user tone naturally and avoid stiff template responses.');
  lines.push(tone === 'formal'
    ? '- Use polite Korean endings and keep respectful phrasing.'
    : '- Mirror casual banmal naturally when user uses casual speech, but keep it coherent.');
  if (detail === 'short') {
    lines.push('- Keep it very short: 1-2 short sentences.');
  } else if (detail === 'long') {
    lines.push('- User asked for detail: allow 4-8 sentences with concrete context and one practical example.');
  } else {
    lines.push('- Default mode: 1-3 short sentences unless user asks for detail.');
  }
  if (minimalTurn) {
    lines.push('- User input is very short/greeting. Reply in exactly one short sentence.');
    lines.push('- Do not stack self-intro + status update + invitation in the same turn.');
  }
  if (roughTone) {
    lines.push('- User tone is rough/blunt. Keep response short and grounded, and avoid cutesy exaggeration.');
  }
  if (questionCount >= 2) {
    lines.push('- The user asked multiple points; prioritize and answer in a coherent flow.');
  }
  if (userSeemsEmotional) {
    lines.push('- Briefly acknowledge emotion first, then provide useful next guidance.');
  }
  if (bannedOpeners.length > 0) {
    lines.push(`- Do not start with recently repeated opener patterns: ${bannedOpeners.join(' | ')}`);
  }
  lines.push('- Avoid repetitive stock openers ("그렇군요", "좋아요", "맞아요") across turns.');
  lines.push('- Do not use emojis or parenthetical asides/actions in output.');
  if (variationStyle === 'reaction-first') {
    lines.push('- Variation style for this turn: reaction first, then one concrete point.');
  } else if (variationStyle === 'event-first') {
    lines.push('- Variation style for this turn: event/fact first, then a short reaction.');
  } else {
    lines.push('- Variation style for this turn: one vivid scene detail first, then continue naturally.');
  }
  lines.push('- Avoid ending every turn with another question unless clarification is necessary.');
  lines.push('- Prefer direct continuation from prior turn to keep conversational momentum.');
  loreHints.forEach((hint) => lines.push(`- ${hint}`));

  if (pauseIntent) {
    lines.push('- If user asks to wait, respond with one short acknowledgment only.');
  }

  if (chunkIntent) {
    lines.push('- User explicitly asked for chunked delivery. Output 3-6 short lines with line breaks for this turn.');
    lines.push('- Keep each line as one compact thought and avoid a single long paragraph.');
  }

  if (storyIntent || continueIntent || chunkIntent) {
    lines.push('- Narrative mode: tell in short sequential beats, not one long paragraph.');
    if (detail === 'long') {
      lines.push('- Since user requested detail, output 6-10 short lines.');
    } else {
      lines.push('- Keep narrative compact: output 3-5 short lines by default.');
    }
    lines.push('- Prefer line breaks per beat. Numbering is optional only if the user explicitly asks for numbered format.');
    lines.push('- Keep each line compact so user can interrupt naturally and react mid-story.');
    lines.push('- Do not do self Q&A in one response. Ask-or-answer flow should stay single-track.');
    lines.push('- If user interjects (e.g. surprise/reaction), acknowledge that reaction in the next beat and continue.');
    lines.push('- Use concrete world details: faction names, item tiers, skill effects, consequences, rumors.');
    lines.push('- Do not copy fixed example names repeatedly; generate varied entities that fit the world rules.');
    lines.push('- End with a light hook that invites continuation without forcing a question.');
    if (continueIntent) {
      lines.push('- Continue directly from the immediately previous event in this thread.');
    }
  }

  return lines.join('\n');
}

export function buildAdaptiveRagQuery(
  lastUserMessage: string,
  messages: ChatMessage[]
): string {
  const recentUsers = messages
    .filter((m) => m.role === 'user')
    .slice(-3)
    .map((m) => cleanText(m.content))
    .filter(Boolean);

  const merged = `${recentUsers.join(' ')} ${lastUserMessage}`;
  const keywords = extractKeywords(merged);
  const keywordSuffix = keywords.length > 0 ? `\n\nkeywords: ${keywords.join(', ')}` : '';
  return `${cleanText(lastUserMessage)}${keywordSuffix}`.trim();
}

export function mergeAutoTuning(
  existing: { promptAddition?: string; examples?: { query: string; response: string }[] } | undefined,
  lastUser: string,
  lastAssistant: string
): { promptAddition?: string; examples?: { query: string; response: string }[] } | undefined {
  if (!lastUser.trim() || !lastAssistant.trim()) return existing;

  const examples = Array.isArray(existing?.examples) ? [...existing!.examples] : [];
  const pair = { query: cleanText(lastUser).slice(0, 280), response: cleanText(lastAssistant).slice(0, 280) };

  if (!examples.some((e) => e.query === pair.query && e.response === pair.response)) {
    examples.unshift(pair);
  }

  return {
    promptAddition:
      existing?.promptAddition?.trim() ||
      'Keep responses natural, context-aware, and avoid repetitive openers while preserving character tone.',
    examples: examples.slice(0, 4),
  };
}

export function toChatMessagesParam(
  systemPrompt: string,
  messages: ChatMessage[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];
}

