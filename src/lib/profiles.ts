import {
  supabase,
  Profile,
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Publication,
  RelatedCourse,
  LanguageTest,
  Scholarship,
  Extracurricular,
  CVSection,
  CustomSection,
} from './supabase';

// 프로필 생성 또는 업데이트 (Upsert)
export async function upsertProfile(data: Partial<Profile> & { id?: string }): Promise<Profile> {
  // ID가 없으면 임시 ID 생성 (개발용)
  const profileId = data.id || crypto.randomUUID();

  const profileData: Partial<Profile> & { id: string; updated_at: string } = {
    id: profileId,
    updated_at: new Date().toISOString(),
  };

  // 기본 필드들
  if (data.username !== undefined) profileData.username = data.username;
  if (data.full_name !== undefined) profileData.full_name = data.full_name;
  if (data.avatar_url !== undefined) profileData.avatar_url = data.avatar_url;
  if (data.email !== undefined) profileData.email = data.email;
  if (data.phone !== undefined) profileData.phone = data.phone;
  if (data.bio !== undefined) profileData.bio = data.bio;
  if (data.description !== undefined) profileData.description = data.description;
  if (data.location !== undefined) profileData.location = data.location;
  if (data.website !== undefined) profileData.website = data.website;
  if (data.github !== undefined) profileData.github = data.github;
  if (data.linkedin !== undefined) profileData.linkedin = data.linkedin;

  // JSONB 필드들
  if (data.education !== undefined) profileData.education = data.education;
  if (data.experience !== undefined) profileData.experience = data.experience;
  if (data.projects !== undefined) profileData.projects = data.projects;
  if (data.skills !== undefined) profileData.skills = data.skills;
  if (data.awards !== undefined) profileData.awards = data.awards;
  if (data.certifications !== undefined)
    profileData.certifications = data.certifications;
  if (data.publications !== undefined)
    profileData.publications = data.publications;
  if (data.related_courses !== undefined)
    profileData.related_courses = data.related_courses;
  if (data.language_tests !== undefined)
    profileData.language_tests = data.language_tests;
  if (data.scholarships !== undefined)
    profileData.scholarships = data.scholarships;
  if (data.extracurricular !== undefined)
    profileData.extracurricular = data.extracurricular;
  if (data.cv_sections !== undefined)
    profileData.cv_sections = data.cv_sections;
  if (data.custom_sections !== undefined)
    profileData.custom_sections = data.custom_sections;

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(profileData)
    .select()
    .single();

  if (error) {
    console.error('프로필 저장 오류:', error);
    throw error;
  }

  return profile as Profile;
}

// ID로 프로필 조회
export async function getProfileById(id: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 프로필이 없음
      return null;
    }
    console.error('프로필 조회 오류:', error);
    throw error;
  }

  return profile as Profile;
}

// Username으로 프로필 조회
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('프로필 조회 오류:', error);
    throw error;
  }

  return profile as Profile;
}

// 모든 프로필 조회
export async function getAllProfiles(): Promise<Profile[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('프로필 목록 조회 오류:', error);
    throw error;
  }

  return profiles as Profile[];
}

// 프로필 삭제
export async function deleteProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);

  if (error) {
    console.error('프로필 삭제 오류:', error);
    throw error;
  }

  return true;
}

// Username 중복 체크
export async function checkUsernameAvailable(
  username: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from('profiles').select('id').eq('username', username);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Username 중복 체크 오류:', error);
    return false;
  }

  return !data || data.length === 0;
}

// 현재 프로필 ID를 로컬 스토리지에서 가져오기 (개발용)
export function getCurrentProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentProfileId');
}

// 현재 프로필 ID를 로컬 스토리지에 저장 (개발용)
export function setCurrentProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentProfileId', id);
}

// 현재 프로필 가져오기
export async function getCurrentProfile(): Promise<Profile | null> {
  const profileId = getCurrentProfileId();
  if (!profileId) return null;

  return await getProfileById(profileId);
}
