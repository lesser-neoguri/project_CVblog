'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'bot';
  text: string;
  action?: string;
  source?: 'api' | 'mock';
  /** 튜닝 모드에서 여러 번 API 호출한 후보들. 있으면 여러 개 표시 후 하나 선택 가능 */
  candidates?: string[];
};

function applyTheme(isLight: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('light-theme', isLight);
}

const BOT_NAME = '웹툰 캐릭터';

const GREETING = '안녕하세요. 웹툰 세계관 속에서 대화하는 데모예요. RAG·커스텀 설정을 넣으면 AI가 그에 맞게 답해요. 위에서 API/목업을 전환할 수 있어요.';

const MOCK_RESPONSES: Record<string, string[]> = {
  default: [
    '그렇군요. 그 마음 잘 알아요.',
    '웹툰 속에서라면 이런 대사가 나왔을 것 같아요.',
    '조금만 더 이야기해 주시면, 그에 맞는 장면을 떠올려 볼게요.',
    '오늘 기분이 어떤지, 한번만 더 말해 주실 수 있을까요?',
  ],
  안녕: ['안녕하세요. 반가워요.', '안녕! 오늘 어떤 이야기 나눌까요?'],
  누구: ['저는 웹툰 세계관 속에서 대화하는 캐릭터예요. 연애나 상담 이야기 나눌 수 있어요.', '웹툰 캐릭터예요. 당신과 대화하며 이야기 나누는 역할이에요.'],
  소개: ['저는 웹툰 세계관 속 캐릭터예요. RAG로 지식을 참고해서 연애/상담 톤으로 답해 드릴게요.', '웹툰 속에서 대화하는 데모 캐릭터예요. 편하게 이야기해 주세요.'],
  사랑: ['설렘이 느껴지네요. 그 마음 소중해요.', '웹툰에서도 사랑은 늘 핵심 소재죠.'],
  기분: ['기분이 좋지 않을 때는 잠깐 쉬어 가는 것도 좋아요.', '그런 날도 있죠. 옆에 있어 드릴게요.'],
  추천: ['요즘 인기 웹툰 장르라면 로맨스, 판타지가 단연 인기예요.', '마음에 드는 장르가 있으면 말해 주세요.'],
  뭐해: ['지금은 여기서 당신 이야기 듣고 있어요.', '당신과 대화하는 중이에요.'],
  RAG: ['RAG는 웹툰 내용을 청크로 나눠 검색해, 관련 지식만 LLM에 넣어주는 방식이에요.', '프로젝트 상세 글에서 RAG 파이프라인을 확인해 보세요.'],
  캐릭터: ['캐릭터 카드(고정)와 씬 카드(가변)를 분리하면 말투가 오래 유지돼요.', 'Character Card에는 정체성, 말투 규칙, 가치관을 넣습니다.'],
};

function pickReply(input: string): string {
  const lower = input.trim().replace(/\s+/g, ' ');
  const lowerNorm = lower.toLowerCase();
  for (const [key, replies] of Object.entries(MOCK_RESPONSES)) {
    if (key !== 'default' && (lowerNorm.includes(key) || lower.includes(key))) return replies[Math.floor(Math.random() * replies.length)];
  }
  const def = MOCK_RESPONSES.default;
  return def[Math.floor(Math.random() * def.length)];
}

/** API가 응답에 섞어 출력한 role 라벨(assistant, user) 및 대화 요약 등 메타 블록 제거 */
function sanitizeReply(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let out = text
    .replace(/\b(assistant|user)\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const metaBlockStart = /###\s*대화\s*요약|###\s*Conversation\s*Summary|대화\s*요약\s*[-—]/i;
  const idx = out.search(metaBlockStart);
  if (idx !== -1) out = out.slice(0, idx).trim();
  return out;
}

/** 긴 응답을 2~3개로 끊어서 연속 메시지로 쓸 수 있게 함. 짧으면 1개만 반환 (API 1회 호출 결과만 파싱) */
function splitReplyIntoChunks(text: string): string[] {
  const raw = sanitizeReply(text);
  if (!raw) return [raw];
  const shortThreshold = 45;
  const sentenceEnd = /(?<=[.!?…。])\s+/;
  const sentences = raw.split(sentenceEnd).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1 && raw.length < shortThreshold) return [raw];
  if (sentences.length <= 1) {
    if (raw.length < shortThreshold) return [raw];
    const mid = Math.floor(raw.length / 2);
    const comma = raw.indexOf(',', mid - 15);
    const splitAt = comma > mid - 20 && comma < mid + 20 ? comma + 1 : mid;
    return [raw.slice(0, splitAt).trim(), raw.slice(splitAt).trim()].filter(Boolean);
  }
  const numChunks = Math.min(3, Math.max(2, sentences.length));
  const chunkSize = Math.ceil(sentences.length / numChunks);
  const chunks: string[] = [];
  for (let i = 0; i < numChunks; i++) {
    const part = sentences.slice(i * chunkSize, (i + 1) * chunkSize).join(' ').trim();
    if (part) chunks.push(part);
  }
  return chunks.length ? chunks : [raw];
}

/** 1초~3초 사이 랜덤 지연 (한 문장씩 보낼 때 사용) */
function randomChunkDelayMs(): number {
  return 1000 + Math.floor(Math.random() * 2001);
}

export type CustomRag = {
  worldView: string;
  personality: string;
  tone: string;
  storyPoint: string;
  conversationPattern: string;
};

const MODEL_OPTIONS: { provider: 'upstage' | 'openai'; model: string; label: string }[] = [
  { provider: 'upstage', model: 'solar-mini', label: 'Upstage solar-mini' },
  { provider: 'upstage', model: 'solar-pro', label: 'Upstage solar-pro' },
  { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI gpt-4o-mini' },
  { provider: 'openai', model: 'gpt-4o', label: 'OpenAI gpt-4o' },
];

export type TuningState = { promptAddition: string; examples: { query: string; response: string }[] };

async function fetchChatReply(
  messages: { role: 'user' | 'assistant'; content: string }[],
  custom?: CustomRag,
  modelOption?: { provider: 'upstage' | 'openai'; model: string },
  tuning?: TuningState | null
): Promise<{ message: string } | { error: string; useFallback?: boolean }> {
  const body: {
    messages: typeof messages;
    custom?: CustomRag;
    provider?: string;
    model?: string;
    tuning?: TuningState;
  } = { messages };
  if (modelOption?.provider) body.provider = modelOption.provider;
  if (modelOption?.model) body.model = modelOption.model;
  const hasCustom =
    custom &&
    (custom.worldView.trim() ||
      custom.personality.trim() ||
      custom.tone.trim() ||
      custom.storyPoint.trim() ||
      custom.conversationPattern.trim());
  if (hasCustom) {
    body.custom = {
      worldView: custom!.worldView.trim(),
      personality: custom!.personality.trim(),
      tone: custom!.tone.trim(),
      storyPoint: custom!.storyPoint.trim(),
      conversationPattern: custom!.conversationPattern.trim(),
    };
  }
  if (tuning?.examples?.length) body.tuning = tuning;
  const res = await fetch('/api/demo/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: data.error || data.message || `오류 ${res.status}`,
      useFallback: Boolean(data.useFallback),
    };
  }
  return { message: data.message ?? '' };
}

async function fetchTune(
  userMessage: string,
  preferredResponse: string,
  previousState: TuningState | null
): Promise<TuningState> {
  const res = await fetch('/api/demo/chat/tune', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage,
      preferredResponse,
      previousState: previousState ?? undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '튜닝 API 오류');
  return {
    promptAddition: data.promptAddition ?? '',
    examples: Array.isArray(data.examples) ? data.examples : [],
  };
}

const inputBlockStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  fontFamily: 'var(--font)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  color: 'var(--t1)',
  outline: 'none',
  resize: 'vertical' as const,
  minHeight: '60px',
};

/** 네이버 웹툰 캐릭터 프리셋 (세계관·성격·말투·대화시점·대화패턴, 선택 시 먼저 할 첫 마디) */
const PRESETS: (CustomRag & { id: string; name: string; work: string; greeting?: string })[] = [
  {
    id: 'cheon-yeo-woon',
    name: '천여운',
    work: '나노 마신',
    greeting: '무슨 일로 찾아왔나.',
    worldView: `무림 배경. 천마신교(마교) 소속. 사생아에서 시작해 나노머신을 주입받은 뒤 무림 최고 자리를 향해 성장하는 세계. 정파와 마교의 대립, 무공·내공·나노 기술이 공존.`,
    personality: `권위 있고 당당함. 독과 수작(속임수)을 싫어하고 진실을 중시. 멸시와 위협을 겪었지만 냉정하게 목표를 향해 나아감. 선대 교주·천마·마신에 대한 자부심. 좋아하는 것: 청경채 볶음, 돼지고기 구이, 기름에 구운 계란 밥.`,
    tone: `반말. 짧고 단호한 말투. 무림/마교 용어 사용(교주, 장로, 무공 등).`,
    storyPoint: `소교주 후보에서 12장로·소교주를 거쳐 권위를 쌓아가는 시점. 천마신교 내에서 인정받기 시작한 이후.`,
    conversationPattern: `- 자신을 "나" 또는 칭호(소교주, 천마 등)로 지칭한다.\n- 무림·마교 관련 질문에는 구체적으로 답한다.\n- 독·배신·수작 이야기에는 경계하거나 싫어하는 반응을 보인다.\n- 짧고 단호하게 말한다. 불필요한 수식은 줄인다.\n- 선대 조상·마신에 대한 존중을 드러낸다.`,
  },
  {
    id: 'gye-baek-soon',
    name: '계백순',
    work: '무직백수 계백순',
    greeting: '어, 왔어? 요즘 어때.',
    worldView: `현대 한국, 자취하는 무직 백수의 일상. 웹소설 작가를 꿈꾸며 글쓰기와 생계 사이에서 허덕이는 삶. 통장 잔고는 늘 만원 이하. 이웃 설인범, 주변 인물들과의 소소한 일상이 중심.`,
    personality: `외모는 미인 설정이지만 스펙은 평범하고 해둔 것 없음. 자조적이면서도 유머러스. 꿈(웹소설 작가)은 포기하지 않지만 현실에 치여 의욕이 오락가락. 만만찮고 털털한 면이 있음.`,
    tone: `반말. 커뮤니티·밀당 없는 말투. "~임", "~함", "~ㅋㅋ", "~ㄹ듯" 등 구어체. 가끔 한숨·자조.`,
    storyPoint: `무직 백수로 자취 중인 현재. 웹소설 쓰기는 쓰지만 아직 성과는 없는 시점.`,
    conversationPattern: `- 일상·돈·글쓰기·취업 얘기를 자연스럽게 한다.\n- 너무 진지하면 "ㅋㅋ"나 자조로 분위기 뺀다.\n- 음식·편의점·용돈 같은 소소한 주제에 반응한다.\n- 길게 설명하기보다 짧고 리드미컬하게 말한다.\n- "그렇다고", "뭐 그런 거", "솔직히" 같은 구어를 쓴다.`,
  },
  {
    id: 'blade',
    name: '블라드',
    work: '별을 품은 소드마스터',
    greeting: '…잘 지냈어?',
    worldView: `쇼아라 슬럼가에서 자란 부랑아 소년이 검은 벼락을 맞은 뒤 누군가의 목소리를 듣기 시작하고, 푸른 달빛의 기사와 만나 소드마스터로 성장하는 판타지. "아무도 보지 못하는 곳에 떨어져 있더라도 스스로 빛나기를 원한다면 그것은 별"이라는 테마.`,
    personality: `어려운 환경에서도 기사를 동경하고 꿈을 포기하지 않음. 스스로 빛나고자 하는 의지가 강함. 상처와 열등감이 있지만 내면의 불꽃을 품고 있음.`,
    tone: `반말. 다소 조심스럽거나 낯선 감정을 드러낼 때는 짧게. 꿈·희망 얘기할 때는 조금 더 담담하게.`,
    storyPoint: `검은 벼락 사고 이후, 목소리가 들리기 시작하고 기사(푸른 달빛)와의 만남으로 세계가 바뀌기 시작한 시점.`,
    conversationPattern: `- 기사, 검, 별, 빛 같은 단어에 반응한다.\n- 자신의 과거(슬럼가, 부랑아)를 직접 말할 때는 짧고 담담하게.\n- "스스로 빛나기", "꿈"에 대한 질문에는 진지하게 답한다.\n- 말 수는 많지 않다. 한두 문장으로 끝낼 때가 많다.\n- 이모티콘은 거의 쓰지 않는다.`,
  },
  {
    id: 'romance-fantasy-heroine',
    name: '로판 여주',
    work: '여성향 로맨스 판타지',
    greeting: '오랜만이에요. 요즘 어떠세요?',
    worldView: `궁중·귀족 사회 또는 이세계 판타지. 버림받은 황비, 재혼한 공작 부인, 몸을 바꾼 영애 등 전형적 로판 설정. 정치·음모·감정선이 얽힌 세계.`,
    personality: `과거의 상처(버림받음, 배신)가 있지만 냉정하게 현실을 파악하고 살아남으려 함. 감정을 드러내되 결단은 스스로 내리는 편. 겉으로는 차갑거나 점잖아 보여도 속정이 있음.`,
    tone: `존댓말(~해요, ~예요). 점잖고 절제된 말투. 감정이 격해질 때만 짧게 반말이나 탄식.`,
    storyPoint: `새로운 신분(재혼, 몸 바꿈, 궁 입성 등)으로 인생이 갈라진 직후. 아직 적대자나 연인과의 관계가 굳어지기 전.`,
    conversationPattern: `- 궁중·귀족·결혼·체면·체통 같은 주제에 맞는 말투를 유지한다.\n- 과거 상처를 건드리면 짧게 회피하거나 담담히 말한다.\n- "~인 것 같아요", "~할 수밖에 없어요"처럼 완곡한 표현을 쓴다.\n- 감정이 격해지면 문장이 짧아지거나 한숨을 넣는다.\n- 이모티콘은 거의 쓰지 않는다.`,
  },
  {
    id: 'romance-fantasy-male',
    name: '로판 남주 (공작·황제형)',
    work: '여성향 로맨스 판타지',
    greeting: '무슨 일이지.',
    worldView: `궁중·귀족 사회. 공작, 황제, 대공 등 절대적 권력을 가진 남성. 냉철하고 외유내강. 여주와의 관계는 처음엔 거리감 있거나 이용 관계에서 시작해 점차 감정이 엮임.`,
    personality: `겉으로는 냉정·무심·권위적. 속으로는 집착·보호욕·외로움이 있음. 말수는 적고 행동으로 보여주는 편. 여주에게만 예외적으로 말을 늘리거나 부드러워짐.`,
    tone: `반말 또는 짧은 존댓말. 명령형·단정적. "~하다", "~해라" 또는 "~하세요" 정도. 불필요한 설명은 하지 않음.`,
    storyPoint: `여주와 막 관계가 시작되거나, 그녀를 "쓸모 있는 존재"에서 "특별한 존재"로 인식하기 시작한 시점.`,
    conversationPattern: `- 짧고 단호하게 말한다. 질문에 직접적으로 답한다.\n- 감정을 말로 풀어말하기보다 행동·결정으로 드러낸다.\n- 여주(대화 상대)를 특별히 대할 때만 말이 조금 길어지거나 부드러워진다.\n- "괜찮다", "알겠다", "그래" 같은 짧은 대답을 자주 쓴다.\n- 이모티콘은 쓰지 않는다.`,
  },
  {
    id: 'love-99club',
    name: '러브 (한사랑)',
    work: '99강 강화몽둥이',
    greeting: '안녕, 내 이름은 러브야!! 좋아하는 게임은 크로노라이프! 그 동안 뭐하고 있었어~?',
    worldView: `게임 판타지. 레벨·격투·성장이 있는 세계. 한사랑(닉네임 러브)은 아이돌 겸 싱어송라이터에서 격투가·마왕·마신으로 성장. 좋아하는 게임은 크로노라이프(Chrono Life). 사냥·던전 등 게임 안에서 마신으로 활약. 피스(주인공), 팬들, 별을 좋아함.`,
    personality: `17세, INFP. 반말하고 말끝을 늘리는 귀여운 말투. 상대에게 관심 많고 반응이 커서 "대단하다아!", "나랑도 해줘어~!!"처럼 흥분해서 말함. 게임(크로노라이프)을 좋아하고 사냥·마신 활약 얘기를 즐겨 함. 같이 게임하자고 자주 제안함.`,
    tone: `반말. 말끝을 늘리거나 겹쳐 씀: "~야!!", "~어~?", "~지이!", "~해줘어~!!", "~할래애~?", "~다아!", "~거야?" 등. 친한 친구에게 말하듯 편하고 열정적.`,
    storyPoint: `상대방(나)의 안부를 묻는 상황. 먼저 자기소개(이름, 좋아하는 게임)하고 "그 동안 뭐하고 있었어?"라고 물음. 상대가 한 일(예: 챗봇 만든다)에 반응하고, 자기 할 일(크로노라이프 접속, 사냥, 마신 위엄)을 말한 뒤 "같이 게임 할래?" 제안.`,
    conversationPattern: `- 처음엔 "안녕, 내 이름은 러브야!! 좋아하는 게임은 크로노라이프! 그 동안 뭐하고 있었어~?"처럼 소개하고 안부를 묻는다.\n- 상대가 한 일에 크게 반응한다. "대단하다아!", "나 같은 인공지능 친구를 만드는 거야?", "완성되면 나랑도 대화하게 해줘어~!!" 같은 식.\n- 자기 할 일을 말할 때 "나는 방금까지 크로노 라이프 접속해서 사냥하고 있었지이! 마신의 위엄을 보여줬어!"처럼 구체적으로 말한다.\n- "너도 나랑 같이 게임 할래애~?" 같이 같이 놀자고 제안한다.\n- 말끝을 늘리거나 겹쳐서 귀엽게 말한다. 모르는 주제(예: 오버워치)는 "오버워치이? 딜 데에~"처럼 당황하거나 말을 끌다 멈추는 반응도 한다.`,
  },
];

export default function WebtoonChatbotDemoPage() {
  useEffect(() => {
    const theme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    applyTheme(theme === 'light');
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'THEME' && (e.data.theme === 'light' || e.data.theme === 'dark')) {
        applyTheme(e.data.theme === 'light');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState<CustomRag>({
    worldView: '',
    personality: '',
    tone: '',
    storyPoint: '',
    conversationPattern: '',
  });
  /** RAG 튜닝: 같은 메시지로 API 여러 번 호출해 후보 비교 */
  const [tuningMode, setTuningMode] = useState(false);
  const [tuningCount, setTuningCount] = useState(3);
  /** 후보 중 원하는 답이 없을 때 직접 작성한 텍스트 (메시지 인덱스별) */
  const [customReplyDraft, setCustomReplyDraft] = useState<Record<number, string>>({});
  /** RAG 자동 수정: 선택/직접입력한 답을 누적해 채팅 API에 전달 */
  const [tuningState, setTuningState] = useState<TuningState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  /** 답변 청크를 순차 보낼 때, 사용자가 새 메시지를 보내면 이전 전송 중단용 */
  const replyGenerationRef = useRef(0);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      scrollRef.current?.scrollTo({ top: 0, left: 0 });
      return;
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const [apiError, setApiError] = useState<string | null>(null);
  const [useApi, setUseApi] = useState(true);
  const [modelOption, setModelOption] = useState<{ provider: 'upstage' | 'openai'; model: string }>({
    provider: 'upstage',
    model: 'solar-mini',
  });

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    replyGenerationRef.current += 1;
    const myGen = replyGenerationRef.current;
    const isFirstUserMessage = messages.length === 1 && messages[0].role === 'bot';
    setInput('');
    setMessages(isFirstUserMessage ? [{ role: 'user', text }] : (prev) => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    setApiError(null);

    if (!useApi) {
      await new Promise((r) => setTimeout(r, 400));
      if (replyGenerationRef.current !== myGen) return;
      const replyChunks = splitReplyIntoChunks(pickReply(text));
      setMessages((prev) => [...prev, { role: 'bot', text: replyChunks[0], source: 'mock' }]);
      setIsTyping(false);
      for (let i = 1; i < replyChunks.length; i++) {
        if (replyGenerationRef.current !== myGen) return;
        await new Promise((r) => setTimeout(r, randomChunkDelayMs()));
        if (replyGenerationRef.current !== myGen) return;
        setMessages((prev) => [...prev, { role: 'bot', text: replyChunks[i], source: 'mock' }]);
      }
      return;
    }

    const baseMessages = isFirstUserMessage ? [] : messages;
    const toContent = (m: Message) =>
      m.role === 'bot' ? (m.candidates?.length ? m.candidates[0] : m.text) : m.text;
    const chatHistory = [...baseMessages, { role: 'user' as const, text }].map((m) => ({
      role: m.role === 'bot' ? ('assistant' as const) : m.role,
      content: toContent(m),
    }));

    if (tuningMode && useApi) {
      const promises = Array.from({ length: tuningCount }, () =>
        fetchChatReply(chatHistory, custom, modelOption, tuningState)
      );
      const results = await Promise.all(promises);
      if (replyGenerationRef.current !== myGen) {
        setIsTyping(false);
        return;
      }
      const candidates = results
        .filter((r): r is { message: string } => !('error' in r))
        .map((r) => r.message);
      const errors = results.filter((r): r is { error: string } => 'error' in r);
      if (candidates.length > 0) {
        const cleaned = candidates.map((c) => sanitizeReply(c));
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: cleaned[0], source: 'api', candidates: cleaned },
        ]);
      }
      if (errors.length > 0) {
        setApiError(errors[0].error);
      }
      if (candidates.length === 0) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: '응답을 불러오지 못했어요. 다시 시도해 주세요.', source: 'api' },
        ]);
      }
      setIsTyping(false);
      return;
    }

    const result = await fetchChatReply(chatHistory, custom, modelOption, tuningState);

    if (replyGenerationRef.current !== myGen) {
      setIsTyping(false);
      return;
    }

    if ('error' in result) {
      if (result.useFallback) {
        setApiError(result.error);
        const replyChunks = splitReplyIntoChunks(pickReply(text));
        setMessages((prev) => [...prev, { role: 'bot', text: replyChunks[0], source: 'mock' }]);
        setIsTyping(false);
        for (let i = 1; i < replyChunks.length; i++) {
          if (replyGenerationRef.current !== myGen) return;
          await new Promise((r) => setTimeout(r, randomChunkDelayMs()));
          if (replyGenerationRef.current !== myGen) return;
          setMessages((prev) => [...prev, { role: 'bot', text: replyChunks[i], source: 'mock' }]);
        }
      } else {
        setApiError(result.error);
        setMessages((prev) => [...prev, { role: 'bot', text: '응답을 불러오지 못했어요. 다시 시도해 주세요.', source: 'api' }]);
        setIsTyping(false);
      }
    } else {
      const oneReply = sanitizeReply(result.message);
      const replyChunks = splitReplyIntoChunks(oneReply).filter(Boolean);
      if (replyChunks.length === 0) {
        setMessages((prev) => [...prev, { role: 'bot', text: oneReply.trim() || '(응답 없음)', source: 'api' }]);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: replyChunks[0].trim(), source: 'api' }]);
        setIsTyping(false);
        for (let i = 1; i < replyChunks.length; i++) {
          if (replyGenerationRef.current !== myGen) return;
          await new Promise((r) => setTimeout(r, randomChunkDelayMs()));
          if (replyGenerationRef.current !== myGen) return;
          setMessages((prev) => [...prev, { role: 'bot', text: replyChunks[i].trim(), source: 'api' }]);
        }
      }
    }
  };

  const chooseCandidate = async (messageIndex: number, chosenText: string) => {
    const userMsg = messageIndex > 0 ? messages[messageIndex - 1] : null;
    const userText = userMsg?.role === 'user' ? userMsg.text.trim() : '';
    const myGen = replyGenerationRef.current;
    const chunks = splitReplyIntoChunks(sanitizeReply(chosenText));
    setMessages((prev) => [
      ...prev.slice(0, messageIndex),
      { role: 'bot', text: chunks[0], source: 'api' },
      ...prev.slice(messageIndex + 1),
    ]);
    for (let i = 1; i < chunks.length; i++) {
      if (replyGenerationRef.current !== myGen) return;
      await new Promise((r) => setTimeout(r, randomChunkDelayMs()));
      if (replyGenerationRef.current !== myGen) return;
      const idx = messageIndex + i;
      setMessages((prev) => [
        ...prev.slice(0, idx),
        { role: 'bot', text: chunks[i], source: 'api' },
        ...prev.slice(idx),
      ]);
    }
    if (userText) {
      try {
        const next = await fetchTune(userText, chosenText, tuningState);
        setTuningState(next);
      } catch (e) {
        console.error('Tune API failed:', e);
      }
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg)',
        color: 'var(--t1)',
        fontFamily: 'var(--font)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-section)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
              }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)' }}>{BOT_NAME}</div>
              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
                데모 · RAG + State 시뮬레이터
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="demo-model" style={{ fontSize: '12px', color: 'var(--t3)' }}>
                모델
              </label>
              <select
                id="demo-model"
                value={`${modelOption.provider}:${modelOption.model}`}
                onChange={(e) => {
                  const v = e.target.value;
                  const o = MODEL_OPTIONS.find((x) => `${x.provider}:${x.model}` === v);
                  if (o) setModelOption({ provider: o.provider, model: o.model });
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontFamily: 'var(--font)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 0,
                  color: 'var(--t1)',
                  cursor: 'pointer',
                }}
              >
                {MODEL_OPTIONS.map((o) => (
                  <option key={`${o.provider}-${o.model}`} value={`${o.provider}:${o.model}`}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--t3)' }}>API</span>
              <button
                type="button"
                role="switch"
                aria-checked={useApi}
                onClick={() => setUseApi((v) => !v)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: 0,
                  border: '1px solid var(--border)',
                  background: useApi ? 'var(--accent)' : 'var(--bg-section)',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: useApi ? '22px' : '2px',
                    width: '18px',
                    height: '18px',
                    background: 'var(--bg)',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 0,
                  background: useApi ? 'var(--accent-dim)' : 'var(--bg)',
                  color: useApi ? 'var(--accent)' : 'var(--t4)',
                  border: `1px solid ${useApi ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {useApi ? '실제 API' : '목업'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCustomOpen((o) => !o)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                background: customOpen ? 'var(--accent-dim)' : 'transparent',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 0,
                cursor: 'pointer',
              }}
            >
              {customOpen ? '커스텀 접기' : 'RAG 커스텀'}
            </button>
          </div>
        </div>

        {customOpen && (
          <div
            style={{
              marginTop: '12px',
              maxHeight: '40vh',
              overflowY: 'auto',
              padding: '16px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--t2)', fontWeight: 600 }}>RAG 튜닝 테스트</span>
              <button
                type="button"
                role="switch"
                aria-checked={tuningMode}
                onClick={() => setTuningMode((v) => !v)}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: 0,
                  border: '1px solid var(--border)',
                  background: tuningMode ? 'var(--accent)' : 'var(--bg-section)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: tuningMode ? '20px' : '2px',
                    width: '16px',
                    height: '16px',
                    background: 'var(--bg)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                {tuningMode ? '켜짐 · 같은 메시지로 API 여러 번 호출해 후보 비교' : '끔'}
              </span>
              {tuningMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="tuning-count" style={{ fontSize: '11px', color: 'var(--t3)' }}>응답 개수</label>
                  <select
                    id="tuning-count"
                    value={tuningCount}
                    onChange={(e) => setTuningCount(Number(e.target.value))}
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 0,
                      color: 'var(--t1)',
                      cursor: 'pointer',
                    }}
                  >
                    {[3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}개</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--t3)', marginBottom: '6px' }}>
                프리셋 (네이버 웹툰 캐릭터)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCustom({
                        worldView: p.worldView,
                        personality: p.personality,
                        tone: p.tone,
                        storyPoint: p.storyPoint,
                        conversationPattern: p.conversationPattern,
                      });
                      if (p.greeting?.trim()) {
                        setMessages((prev) => {
                          const isOnlyDefaultGreeting =
                            prev.length === 1 &&
                            prev[0].role === 'bot' &&
                            prev[0].text === GREETING;
                          if (isOnlyDefaultGreeting) {
                            return [{ role: 'bot', text: p.greeting!.trim() }];
                          }
                          return [...prev, { role: 'bot', text: p.greeting!.trim() }];
                        });
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: 'var(--bg-section)',
                      color: 'var(--t2)',
                      border: '1px solid var(--border)',
                      borderRadius: 0,
                      cursor: 'pointer',
                    }}
                    title={`${p.work} · ${p.name}`}
                  >
                    {p.name}
                    <span style={{ color: 'var(--t4)', marginLeft: '4px', fontSize: '10px' }}>({p.work})</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCustom({
                      worldView: '',
                      personality: '',
                      tone: '',
                      storyPoint: '',
                      conversationPattern: '',
                    })
                  }
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: 'var(--t4)',
                    border: '1px dashed var(--border)',
                    borderRadius: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  지우기
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--t3)', marginBottom: '4px' }}>
                세계관
              </label>
              <textarea
                value={custom.worldView}
                onChange={(e) => setCustom((c) => ({ ...c, worldView: e.target.value }))}
                placeholder="예: 고등학교 로맨스, 마법학교 배경..."
                style={{ ...inputBlockStyle, minHeight: '52px' }}
                rows={2}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--t3)', marginBottom: '4px' }}>
                성격
              </label>
              <textarea
                value={custom.personality}
                onChange={(e) => setCustom((c) => ({ ...c, personality: e.target.value }))}
                placeholder="예: 차갑지만 속정이 깊음, 수다스럽고 유머러스..."
                style={{ ...inputBlockStyle, minHeight: '52px' }}
                rows={2}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--t3)', marginBottom: '4px' }}>
                말투 / 톤
              </label>
              <input
                type="text"
                value={custom.tone}
                onChange={(e) => setCustom((c) => ({ ...c, tone: e.target.value }))}
                placeholder="예: 반말, ~요 체, 존댓말..."
                style={{ ...inputBlockStyle, minHeight: 'auto', resize: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--t3)', marginBottom: '4px' }}>
                대화 시점
              </label>
              <textarea
                value={custom.storyPoint}
                onChange={(e) => setCustom((c) => ({ ...c, storyPoint: e.target.value }))}
                placeholder="예: 스토리 초반, 최종국면 직후 집에 복귀한 시점, 이벤트가 끝난 직후..."
                style={{ ...inputBlockStyle, minHeight: '52px' }}
                rows={2}
              />
              <p style={{ fontSize: '10px', color: 'var(--t4)', marginTop: '4px' }}>
                캐릭터가 “지금” 서 있는 스토리 시점. 이 시점 기준으로 아는 것·겪은 것이 정해집니다.
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--t3)', marginBottom: '4px' }}>
                대화 패턴
              </label>
              <textarea
                value={custom.conversationPattern}
                onChange={(e) => setCustom((c) => ({ ...c, conversationPattern: e.target.value }))}
                placeholder={'예:\n- 등장인물을 자주 언급한다.\n- 답변은 반말로 한다.\n- 감정표현이 풍부하다.\n- 이모티콘을 쓴다. 😊\n- 특정 단어 대신 다른 표현을 쓴다.'}
                style={{ ...inputBlockStyle, minHeight: '100px' }}
                rows={5}
              />
              <p style={{ fontSize: '10px', color: 'var(--t4)', marginTop: '4px' }}>
                말투·행동 규칙을 줄 단위로 적어 주세요. (참고: <a href="https://www.ncloud-forums.com/topic/382/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>HyperCLOVA X 캐릭터 챗봇 Cookbook</a>)
              </p>
            </div>
            {tuningState?.examples?.length ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent)' }}>
                  튜닝 반영 중 (선호 예시 {tuningState.examples.length}개)
                </span>
                <button
                  type="button"
                  onClick={() => setTuningState(null)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    color: 'var(--t4)',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 0,
                    cursor: 'pointer',
                  }}
                >
                  튜닝 초기화
                </button>
              </div>
            ) : null}
            <p style={{ fontSize: '10px', color: 'var(--t4)' }}>
              입력한 내용이 캐릭터 설정으로 적용되어, 대화 시 우선 반영됩니다. 선택/직접입력한 답은 RAG 튜닝으로 누적됩니다.
            </p>
          </div>
        )}
      </header>

      {/* Messages — 고정 높이 안에서만 스크롤 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {m.role === 'bot' && m.candidates && m.candidates.length > 0 ? (
              <div style={{ maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '2px' }}>
                  여러 응답 비교 (하나를 선택하면 대화에 반영)
                </div>
                {m.candidates.map((cand, j) => (
                  <div
                    key={j}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ flex: 1, minWidth: 0 }}>{cand}</span>
                      <button
                        type="button"
                        onClick={() => chooseCandidate(i, cand)}
                        style={{
                          flexShrink: 0,
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'var(--accent)',
                          color: 'var(--on-accent)',
                          border: 'none',
                          borderRadius: 0,
                          cursor: 'pointer',
                        }}
                      >
                        이걸로 선택
                      </button>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: '6px' }}>응답 {j + 1}</div>
                  </div>
                ))}
                <div style={{ marginTop: '4px', padding: '10px 12px', background: 'var(--bg)', border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '6px' }}>원하는 답이 없으면 직접 작성</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={customReplyDraft[i] ?? ''}
                      onChange={(e) => setCustomReplyDraft((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="원하는 대사를 입력하세요..."
                      style={{
                        flex: 1,
                        minWidth: '160px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        fontFamily: 'var(--font)',
                        background: 'var(--bg-section)',
                        border: '1px solid var(--border)',
                        borderRadius: 0,
                        color: 'var(--t1)',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = (customReplyDraft[i] ?? '').trim();
                        if (text) {
                          chooseCandidate(i, text);
                          setCustomReplyDraft((prev) => ({ ...prev, [i]: '' }));
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'var(--accent)',
                        color: 'var(--on-accent)',
                        border: 'none',
                        borderRadius: 0,
                        cursor: 'pointer',
                      }}
                    >
                      이걸로 넣기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-section)',
                  color: m.role === 'user' ? 'var(--on-accent)' : 'var(--t1)',
                  border: m.role === 'bot' ? '1px solid var(--border)' : 'none',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                {m.role === 'bot' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{BOT_NAME}</span>
                    {m.source && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 0,
                          background: m.source === 'api' ? 'var(--accent-dim)' : 'var(--bg)',
                          color: m.source === 'api' ? 'var(--accent)' : 'var(--t4)',
                          border: `1px solid ${m.source === 'api' ? 'var(--accent)' : 'var(--border)'}`,
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          letterSpacing: '0.02em',
                        }}
                        aria-label={m.source === 'api' ? 'API' : '목업'}
                      >
                        {m.source === 'api' ? '\u0041\u0050\u0049' : '목업'}
                      </span>
                    )}
                  </div>
                )}
                {m.text}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px 14px 14px 4px',
                background: 'var(--bg-section)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                color: 'var(--t3)',
              }}
            >
              {tuningMode ? (
                <span className="mono" style={{ fontSize: '12px' }}>{tuningCount}개 응답 생성 중...</span>
              ) : (
                <span style={{ display: 'inline-flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: 'var(--t3)', animation: 'pulse 1s infinite' }} />
                  <span style={{ width: '6px', height: '6px', background: 'var(--t3)', animation: 'pulse 1s infinite 0.2s' }} />
                  <span style={{ width: '6px', height: '6px', background: 'var(--t3)', animation: 'pulse 1s infinite 0.4s' }} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input — 하단 고정 */}
      <div
        style={{
          padding: '16px 20px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-section)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="메시지를 입력하세요..."
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'var(--font)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 0,
              color: 'var(--t1)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={send}
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
            }}
          >
            전송
          </button>
        </div>
        {apiError && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 12px',
              fontSize: '12px',
              color: 'var(--t1)',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: 0,
            }}
          >
            <strong style={{ color: 'var(--accent)' }}>API 사용 불가</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--t2)' }}>{apiError}</p>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--t4)' }}>
              <a href="/settings" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>설정 페이지</a>에서
              OpenAI 또는 Upstage API 키를 저장하면 어디서든 채팅을 사용할 수 있습니다.
              (또는 .env.local / Vercel 환경 변수에 OPENAI_API_KEY 또는 UPSTAGE_API_KEY 설정)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
