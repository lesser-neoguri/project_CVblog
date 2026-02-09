import { supabase } from './supabase';

// 이미지 업로드 (Storage)
export async function uploadImage(file: File): Promise<string> {
  try {
    // 파일 이름 생성 (타임스탬프 + 랜덤 문자열 + 원본 확장자)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `post-images/${fileName}`;

    // 버킷이 없으면 생성 (public 버킷)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === 'posts');

    if (!bucketExists) {
      await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }

    // 파일 업로드
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

// 이미지 삭제
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('post-images')).join('/');

    const { error } = await supabase.storage.from('posts').remove([filePath]);

    if (error) {
      console.error('이미지 삭제 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

// 파일 유효성 검사
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 파일 크기 체크 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기는 5MB 이하여야 합니다.' };
  }

  // 파일 타입 체크
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'JPG, PNG, GIF, WebP 형식만 지원합니다.' };
  }

  return { valid: true };
}
