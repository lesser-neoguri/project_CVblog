import { NextRequest, NextResponse } from 'next/server';

const TUNING_MAX_EXAMPLES = 5;

export type TuningExample = { query: string; response: string };
export type TuningState = {
  promptAddition: string;
  examples: TuningExample[];
};

/**
 * RAG 자동 수정(튜닝) API.
 * 사용자가 선택하거나 직접 입력한 답을 누적하고, 이를 반영한 프롬프트 보강문을 반환.
 * 재귀적으로 호출될 때마다 상태가 갱신되며, 최근 예시에 더 높은 가중치(앞에 배치).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessage =
      typeof body.userMessage === 'string' ? body.userMessage.trim() : '';
    const preferredResponse =
      typeof body.preferredResponse === 'string' ? body.preferredResponse.trim() : '';

    if (!userMessage || !preferredResponse) {
      return NextResponse.json(
        { error: 'userMessage와 preferredResponse가 필요합니다.' },
        { status: 400 }
      );
    }

    const previous: TuningState | undefined = body.previousState &&
      typeof body.previousState === 'object' &&
      Array.isArray(body.previousState.examples)
      ? {
          promptAddition:
            typeof body.previousState.promptAddition === 'string'
              ? body.previousState.promptAddition
              : '',
          examples: body.previousState.examples.filter(
            (e: unknown) =>
              e &&
              typeof e === 'object' &&
              typeof (e as TuningExample).query === 'string' &&
              typeof (e as TuningExample).response === 'string'
          ) as TuningExample[],
        }
      : undefined;

    const newPair: TuningExample = { query: userMessage, response: preferredResponse };
    const prevExamples = previous?.examples ?? [];
    const merged = [newPair, ...prevExamples.filter(
      (e) => e.query !== newPair.query || e.response !== newPair.response
    )].slice(0, TUNING_MAX_EXAMPLES);

    const promptAddition =
      previous?.promptAddition?.trim() ||
      '아래 [선호 응답 예시]와 같은 톤·길이·스타일로 답하세요. 위로 갈수록 최근 선택(가중치 높음).';

    const state: TuningState = {
      promptAddition,
      examples: merged,
    };

    return NextResponse.json(state);
  } catch (err) {
    console.error('Demo chat tune API error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
