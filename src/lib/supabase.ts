import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 타입 정의
export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content: string;
  author_id: string | null;
  published: boolean;
  slug: string | null;
  blocks: Record<string, unknown> | null;
  images: string[] | null;
}

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  // 사용자 권한 구분용 필드 (예: 'user' | 'admin')
  role?: 'user' | 'admin';
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  description: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  education: Education[] | null;
  experience: Experience[] | null;
  projects: Project[] | null;
  skills: string[] | null;
  awards: Award[] | null;
  certifications: Certification[] | null;
  publications: Publication[] | null;
  related_courses: RelatedCourse[] | null;
  language_tests: LanguageTest[] | null;
  scholarships: Scholarship[] | null;
  extracurricular: Extracurricular[] | null;
  cv_sections: CVSection[] | null;
  custom_sections: CustomSection[] | null;
  user_id: string | null; // Supabase Auth 사용자 ID
}

export interface Education {
  id?: string;
  school: string;
  institution?: string;
  degree: string;
  major: string;
  field?: string;
  startYear: string;
  endYear: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  gpa?: string;
  location?: string;
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
  location?: string;
  type?: string;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  technologies?: string[];
  techStack?: string[];
  startDate: string;
  endDate: string;
  current?: boolean;
  url?: string;
  github?: string;
  image?: string;
}

export interface Award {
  id?: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface Certification {
  id?: string;
  title: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Publication {
  id?: string;
  title: string;
  authors: string | string[];
  venue: string;
  date: string;
  url?: string;
  doi?: string;
  description?: string;
}

export interface RelatedCourse {
  id?: string;
  title?: string;
  name?: string;
  institution?: string;
  date?: string;
  description?: string;
  grade?: string;
}

export interface LanguageTest {
  id?: string;
  test?: string;
  testName?: string;
  score: string;
  date: string;
  expiryDate?: string;
  expired?: boolean;
  details?: Record<string, string>;
}

export interface Scholarship {
  id?: string;
  title: string;
  provider?: string;
  issuer?: string;
  amount?: string;
  date: string;
  duration?: string;
  description?: string;
}

export interface Extracurricular {
  id?: string;
  title?: string;
  name?: string;
  organization?: string;
  role: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
}

export interface CVSection {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export interface CustomSection {
  id: string;
  title?: string;
  name?: string;
  content: string;
  visible?: boolean;
  order?: number;
}

// 지식 그래프 타입 정의
export interface KnowledgeNode {
  id: string;
  created_at: string;
  updated_at: string;
  label: string;
  type: 'paper' | 'technology' | 'concept' | 'field';
  description: string | null;
  url: string | null;
  color: string | null;
  metadata: Record<string, unknown>;
}

export interface KnowledgeEdge {
  id: string;
  created_at: string;
  source_id: string;
  target_id: string;
  relationship: string;
}

// 프로젝트 본문 하단 토글 섹션 (구현 로그 등)
export interface ImplementationSection {
  id: string;
  title: string;
  content: string;
}

// 포트폴리오 프로젝트 타입 정의
export interface PortfolioProject {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  tags: string[];
  status: 'completed' | 'in_progress' | 'planned';
  start_date: string | null;
  end_date: string | null;
  demo_url: string | null;
  github_url: string | null;
  featured: boolean;
  published: boolean;
  author_id: string | null;
  sort_order: number;
  implementation_sections: ImplementationSection[] | null;
}

// 논문 리뷰 타입 정의
export interface PaperReview {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;           // 논문 제목
  authors: string;         // 저자 (콤마 구분)
  venue: string;           // 학회/저널 (e.g. NeurIPS 2024)
  year: number;            // 출판 연도
  paper_url: string | null; // 원문 링크
  tldr: string;            // 한 줄 요약
  content: string;         // 마크다운 리뷰 본문
  tags: string[];          // 태그 (e.g. ['LLM', 'Transformer'])
  rating: number;          // 평점 (1~5)
  published: boolean;
  author_id: string | null;
  node_label: string | null; // 지식 그래프 노드 표시 이름 (미입력 시 title 사용)
}

// Auth 헬퍼 함수
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // 세션이 없을 때 발생하는 AuthSessionMissingError는 null을 반환하도록 처리
      if ((error as any).name === 'AuthSessionMissingError' || error.message === 'Auth session missing!') {
        return null;
      }
      throw error;
    }
    return user;
  } catch (err: any) {
    if (err?.name === 'AuthSessionMissingError' || err?.message === 'Auth session missing!') {
      return null;
    }
    throw err;
  }
}

// 현재 로그인 사용자의 역할(role)을 profiles 테이블 기준으로 조회
// - 프로필이 없거나 role이 없으면 'user'
// - 로그인하지 않았으면 null
export async function getCurrentUserRole(): Promise<'admin' | 'user' | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const email = user.email;
  if (!email) return 'user';

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('프로필 role 조회 오류:', error);
      return 'user';
    }

    const role = (data as { role?: string } | null)?.role;
    return role === 'admin' ? 'admin' : 'user';
  } catch (err) {
    console.error('프로필 role 조회 중 예외:', err);
    return 'user';
  }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

// Auth 상태 변화 리스너
export function onAuthStateChange(callback: (user: unknown) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return subscription;
}
