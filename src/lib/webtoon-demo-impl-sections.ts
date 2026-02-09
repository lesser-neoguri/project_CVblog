/**
 * 웹툰 챗봇 데모 "지금까지 구현한 내용" — 프로젝트 본문 아래 토글로 볼 수 있는 섹션들
 */
export type ImplSection = { id: string; title: string; content: string };

export const WEBTOON_DEMO_IMPL_SECTIONS: ImplSection[] = [
  {
    id: 'demo-base',
    title: '데모 구성 및 기본 동작',
    content: `- **채팅 UI**: 사용자/봇 말풍선, 입력창, 전송. RAG·커스텀 설정을 반영한 시스템 프롬프트로 LLM이 답변 생성.
- **RAG 커스텀 패널**: 세계관, 성격, 말투/톤, 대화 시점, 대화 패턴 입력. [NAVER Cloud 포스트](https://www.ncloud-forums.com/topic/382/) (HyperCLOVA X 캐릭터 챗봇) 참고.
- **API / 목업 토글**: 실제 API와 키워드 목업 전환. API 키 없어도 데모 체험 가능.
- **메시지별 출처 뱃지**: 봇 메시지에 "API" 또는 "목업" 표시.`,
  },
  {
    id: 'short-reply',
    title: '짧고 대화형 답변 (프롬프트 기본)',
    content: `- 시스템 프롬프트 **맨 앞**에 공통 규칙 추가: 한두 문장~세 문장, 한 번에 한 가지 말, 회피·나열 금지.
- \`max_tokens\` 280으로 제한해 길게 말하기를 줄임.
- 어떤 캐릭터/설정이든 "짧고 대화형"이 기본이 되도록 적용.`,
  },
  {
    id: 'rag-tune',
    title: 'RAG 튜닝 (다중 응답 비교 · 자동 수정)',
    content: `- **튜닝 모드 토글**: RAG 커스텀 패널에서 "RAG 튜닝 테스트" 켜면, 같은 메시지로 API를 3~5번 호출해 후보 응답을 나란히 표시.
- **이걸로 선택** / **직접 입력 후 이걸로 넣기**: 마음에 드는 답 하나를 골라 대화에 반영.
- **RAG 자동 수정 API** (\`/api/demo/chat/tune\`): 선택·직접 입력한 답을 (userMessage, preferredResponse) 쌍으로 누적. 최근 5개까지 유지, 위로 갈수록 가중치 높음.
- **채팅 API**: 요청 시 \`tuning\`(선호 예시 목록)을 넘기면 시스템 프롬프트에 "[선호 응답 예시]" 블록으로 주입해, 이후 답변이 그 스타일에 맞춰지도록 함.`,
  },
  {
    id: 'preset-greeting',
    title: '프리셋 선택 시 캐릭터가 먼저 인사',
    content: `- 각 프리셋에 \`greeting\`(첫 마디) 필드 추가.
- 프리셋 선택 시: 대화가 비어 있으면 기본 안내를 greeting으로 교체, 이미 대화가 있으면 그 뒤에 greeting 한 줄 추가.
- 예: 러브 선택 시 "안녕, 내 이름은 러브야!! 좋아하는 게임은 크로노라이프! 그 동안 뭐하고 있었어~?"`,
  },
  {
    id: 'preset-love',
    title: '99강 강화몽둥이 러브 프리셋',
    content: `- **러브 (한사랑)** 프리셋 추가. 안부를 묻는 상황, 반말·말끝 늘리기("~야!!", "~어~?", "~할래애~?"), 크로노라이프·마신 얘기, "같이 게임 할래?" 제안 등 대화 패턴 반영.`,
  },
  {
    id: 'chunk-display',
    title: '한 문장씩 끊어서 표시 · 말풍선 라운드',
    content: `- API **1회 호출** 후 응답을 문장 단위로 파싱해 2~5개 청크로 나눔. 짧으면 1개만.
- 각 청크를 **1~3초 랜덤 간격**으로 순차 표시 (한 문장씩 나오는 느낌).
- 말풍선에 **라운드** 적용 (14px, 말꼬리 느낌).`,
  },
  {
    id: 'api-once-sanitize',
    title: 'API 1회 호출 · assistant/user 오류 제거',
    content: `- 채팅은 항상 **한 번만** 호출하고, 받은 문자열만 파싱해 여러 말풍선으로 표시.
- 응답에 모델이 섞어 출력한 "assistant", "user" 문자열을 \`sanitizeReply\`로 제거.
- 시스템 프롬프트에 "응답에 assistant, user 역할 이름을 쓰지 마세요" 추가.`,
  },
  {
    id: 'interrupt',
    title: '답변 중 새 메시지 시 이전 전송 중단',
    content: `- \`replyGenerationRef\`로 "세대" 관리. 사용자가 전송할 때마다 ref 증가.
- 청크를 순차 추가하는 루프에서, delay 전·후에 \`replyGenerationRef.current !== myGen\`이면 즉시 return해 나머지 청크 추가를 멈춤.
- 새 메시지에 대한 답만 이어서 표시.`,
  },
  {
    id: 'context-repeat',
    title: '이전 대화 참고 · 같은 말 반복 방지',
    content: `- 시스템 프롬프트에 "이전 대화 내용을 반드시 참고해서 답하세요. 앞서 나온 약속·주제·질문을 기억하고 맥락에 맞게 이어서 말하세요" 추가.
- "같은 말 반복 금지" 규칙 추가: 이미 말한 문장(제안·약속·감탄)을 그대로 또는 비슷하게 다시 말하지 말 것. 새로 할 말이 있으면 그걸, 없으면 대화를 이어가는 다른 한 마디로.`,
  },
  {
    id: 'api-upstage',
    title: 'API 사용 구분 · Upstage 연동',
    content: `- API 실패 시 에러 메시지를 입력창 아래에 표시. .env.local 설정 안내 포함.
- Upstage: Base URL \`https://api.upstage.ai/v1/solar\`, 기본 모델 \`solar-mini\`. 400 오류 시 UPSTAGE_CHAT_MODEL, UPSTAGE_BASE_URL 안내.`,
  },
];
