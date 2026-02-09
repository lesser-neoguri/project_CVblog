/**
 * 웹툰 챗봇 프로젝트에 정리한 본문 + implementation_sections DB 반영 (1회 호출용)
 * POST /api/projects/seed-webtoon-sections
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { WEBTOON_DEMO_IMPL_SECTIONS } from '@/lib/webtoon-demo-impl-sections';
import { updateProject } from '@/lib/portfolio';

const SECTION_10_START = '\n\n## 10. 데모 구현과 시행착오\n\n';
const NEW_ENDING =
  '\n\n---\n\n아래 **지금까지 구현한 내용**에서 데모 구성, RAG 튜닝, 프리셋, 답변 표시 방식, API 연동 등 항목별로 펼쳐 볼 수 있습니다.';

export async function POST() {
  try {
    const { data: projects, error: listErr } = await supabase
      .from('portfolio_projects')
      .select('id, title, demo_url, description')
      .not('demo_url', 'is', null);

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const webtoon = projects?.find((p) => p.demo_url?.includes('webtoon-chatbot'));
    if (!webtoon) {
      return NextResponse.json(
        { message: 'demo_url에 webtoon-chatbot이 포함된 프로젝트가 없습니다.' },
        { status: 404 }
      );
    }

    let newDescription = (webtoon.description || '') as string;
    const idx = newDescription.indexOf(SECTION_10_START);
    if (idx !== -1) {
      newDescription = newDescription.slice(0, idx) + NEW_ENDING;
    } else if (!newDescription.includes('지금까지 구현한 내용')) {
      newDescription = newDescription.trimEnd() + NEW_ENDING;
    }

    await updateProject(webtoon.id, {
      description: newDescription,
      implementation_sections: WEBTOON_DEMO_IMPL_SECTIONS,
    });

    return NextResponse.json({
      message: 'OK',
      projectId: webtoon.id,
      title: webtoon.title,
    });
  } catch (e) {
    console.error('seed-webtoon-sections:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
