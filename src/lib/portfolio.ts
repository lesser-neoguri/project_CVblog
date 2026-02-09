import { supabase, PortfolioProject } from './supabase';

// 프로젝트 목록 조회
export async function getProjects(publishedOnly = true): Promise<PortfolioProject[]> {
  let query = supabase
    .from('portfolio_projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;
  if (error) { console.error('프로젝트 목록 조회 오류:', error); throw error; }
  return data as PortfolioProject[];
}

// ID로 프로젝트 조회
export async function getProjectById(id: string): Promise<PortfolioProject> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) { console.error('프로젝트 조회 오류:', error); throw error; }
  return data as PortfolioProject;
}

// 프로젝트 생성
export async function createProject(data: {
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: string;
  start_date?: string;
  end_date?: string;
  demo_url?: string;
  github_url?: string;
  featured?: boolean;
  published?: boolean;
  sort_order?: number;
  implementation_sections?: { id: string; title: string; content: string }[] | null;
}): Promise<PortfolioProject> {
  const { data: project, error } = await supabase
    .from('portfolio_projects')
    .insert({
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description || null,
      thumbnail_url: data.thumbnail_url || null,
      tags: data.tags || [],
      status: data.status || 'in_progress',
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      demo_url: data.demo_url || null,
      github_url: data.github_url || null,
      featured: data.featured ?? false,
      published: data.published ?? false,
      sort_order: data.sort_order ?? 0,
      implementation_sections: data.implementation_sections ?? null,
    })
    .select()
    .single();

  if (error) { console.error('프로젝트 생성 오류:', error); throw error; }
  return project as PortfolioProject;
}

// 프로젝트 수정 (implementation_sections 포함)
export async function updateProject(
  id: string,
  updates: Partial<Omit<PortfolioProject, 'id' | 'created_at'>>
): Promise<PortfolioProject> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // Supabase 에러 객체를 표준 Error 로 래핑해서 상위에서 처리/표시하기 쉽게 만듭니다.
    console.error('프로젝트 수정 오류 (Supabase 원본):', error);
    const message =
      // Supabase PostgrestError 형태
      (error as any).message ||
      (error as any).hint ||
      (error as any).details ||
      '프로젝트 수정 중 알 수 없는 오류가 발생했습니다.';
    throw new Error(message);
  }

  return data as PortfolioProject;
}

// 프로젝트 삭제
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('portfolio_projects')
    .delete()
    .eq('id', id);

  if (error) { console.error('프로젝트 삭제 오류:', error); throw error; }
}
