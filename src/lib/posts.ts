import { supabase, Post } from './supabase';
import { deleteImage } from './storage';

// 새 글 생성
export async function createPost(data: {
  title: string;
  content: string;
  slug?: string;
  published?: boolean;
  images?: string[];
}): Promise<Post> {
  // slug가 제공되면 중복 체크 후 유니크하게 생성
  let finalSlug = data.slug || null;
  if (finalSlug) {
    finalSlug = await generateUniqueSlug(finalSlug);
  }
  
  // 이미지 URL 추출 (마크다운에서)
  const imageUrls = data.images || extractImageUrls(data.content);
  
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: data.title,
      content: data.content,
      slug: finalSlug,
      published: data.published ?? false,
      images: imageUrls,
    })
    .select()
    .single();

  if (error) {
    console.error('글 생성 오류:', error);
    throw error;
  }

  return post as Post;
}

// 모든 글 조회 (발행된 글만 또는 전체)
export async function getPosts(publishedOnly: boolean = true): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('published', true);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error('글 목록 조회 오류:', error);
    throw error;
  }

  return posts as Post[];
}

// ID로 글 조회
export async function getPostById(id: string): Promise<Post> {
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('글 조회 오류:', error);
    throw error;
  }

  return post as Post;
}

// Slug로 글 조회
export async function getPostBySlug(slug: string): Promise<Post> {
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('글 조회 오류:', error);
    throw error;
  }

  return post as Post;
}

// 글 수정
export async function updatePost(
  id: string,
  data: {
    title?: string;
    content?: string;
    slug?: string;
    published?: boolean;
  }
): Promise<Post> {
  // 기존 글 조회
  const oldPost = await getPostById(id);
  
  const updateData: Partial<Post> & { updated_at: string } = {
    ...data,
    updated_at: new Date().toISOString(),
  };
  
  // slug가 변경되는 경우 중복 체크
  if (data.slug) {
    updateData.slug = await generateUniqueSlug(data.slug, id);
  }
  
  // 이미지 URL 업데이트
  if (data.content) {
    const newImageUrls = extractImageUrls(data.content);
    updateData.images = newImageUrls;
    
    // 사용하지 않는 이미지 삭제
    const oldImageUrls = oldPost.images || [];
    const removedImages = oldImageUrls.filter(url => !newImageUrls.includes(url));
    
    // 비동기로 이미지 삭제 (에러가 발생해도 글 수정은 계속 진행)
    removedImages.forEach(url => {
      deleteImage(url).catch(err => 
        console.error(`이미지 삭제 실패: ${url}`, err)
      );
    });
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('글 수정 오류:', error);
    throw error;
  }

  return post as Post;
}

// 글 삭제
export async function deletePost(id: string): Promise<boolean> {
  // 글 조회하여 이미지 URL 가져오기
  const post = await getPostById(id);
  
  // 글 삭제
  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    console.error('글 삭제 오류:', error);
    throw error;
  }
  
  // 연관된 이미지 삭제 (비동기, 실패해도 계속 진행)
  if (post.images && post.images.length > 0) {
    post.images.forEach(url => {
      deleteImage(url).catch(err => 
        console.error(`이미지 삭제 실패: ${url}`, err)
      );
    });
  }

  return true;
}

// 제목으로 slug 생성
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-가-힣]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// slug 중복 체크 및 유니크한 slug 생성
export async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // 현재 slug가 이미 존재하는지 확인
    let query = supabase
      .from('posts')
      .select('id')
      .eq('slug', slug);
    
    // 수정 시 현재 글은 제외
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('slug 중복 체크 오류:', error);
      // 에러 발생 시 타임스탬프 추가하여 유니크하게
      return `${baseSlug}-${Date.now()}`;
    }
    
    // 중복이 없으면 현재 slug 반환
    if (!data || data.length === 0) {
      return slug;
    }
    
    // 중복이 있으면 숫자를 붙여서 다시 시도
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// 마크다운에서 이미지 URL 추출
export function extractImageUrls(content: string): string[] {
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  const urls: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}
