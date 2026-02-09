'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import MarkdownEditor from '@/components/MarkdownEditor';
import ImageUploader from '@/components/ImageUploader';
import { getPostById, updatePost, generateSlug } from '@/lib/posts';
import { Post } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

export default function EditPostPage() {
  const { isLightTheme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    if (params.id) {
      loadPost(params.id as string);
    }
  }, [params.id]);

  const loadPost = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getPostById(id);
      setPost(data);
      setTitle(data.title);
      setContent(data.content);
      setSlug(data.slug || '');
      setPublished(data.published);
    } catch (err: unknown) {
      console.error('글 로딩 오류:', err);
      setError('글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (imageUrl: string, markdownText: string) => {
    // 업로드된 이미지 URL을 배열에 추가
    setUploadedImages((prev) => [...prev, imageUrl]);
    
    // 마크다운 텍스트를 에디터에 삽입
    setContent((prev) => {
      return prev ? `${prev}\n\n${markdownText}\n` : `${markdownText}\n`;
    });
  };

  const handleImageUploadError = (error: string) => {
    setError(error);
    setTimeout(() => setError(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!post) return;

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const finalSlug = slug.trim() || generateSlug(title);
      await updatePost(post.id, {
        title: title.trim(),
        content: content.trim(),
        slug: finalSlug,
        published,
      });

      showAlert('글이 성공적으로 수정되었습니다!');
      setTimeout(() => router.push(`/posts/${post.id}`), 1000);
    } catch (err: unknown) {
      console.error('수정 오류:', err);
      setError(err instanceof Error ? err.message : '글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
          color: isLightTheme ? '#111' : '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontSize: '16px', opacity: 0.7 }}>로딩 중...</p>
      </main>
    );
  }

  if (error && !post) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
          color: isLightTheme ? '#111' : '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#ef4444', marginBottom: '20px' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/posts')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              background: isLightTheme ? '#111' : '#fafafa',
              color: isLightTheme ? '#fafafa' : '#111',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
        color: isLightTheme ? '#111' : '#fafafa',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            padding: '32px 40px',
            borderRadius: '20px',
            background: isLightTheme
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.08)',
            border: isLightTheme
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: isLightTheme
              ? '0 12px 30px rgba(0,0,0,0.08)'
              : '0 12px 30px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
            글 수정
          </h1>

          <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
            {/* 제목 입력 */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="title"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                제목
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="글 제목을 입력하세요"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: isLightTheme
                    ? '1px solid rgba(0, 0, 0, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: isLightTheme
                    ? 'rgba(255, 255, 255, 0.8)'
                    : 'rgba(0, 0, 0, 0.2)',
                  color: isLightTheme ? '#111' : '#fafafa',
                  outline: 'none',
                }}
              />
            </div>

            {/* Slug 입력 */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="slug"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                URL 슬러그
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="비워두면 제목에서 자동 생성됩니다"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: isLightTheme
                    ? '1px solid rgba(0, 0, 0, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: isLightTheme
                    ? 'rgba(255, 255, 255, 0.8)'
                    : 'rgba(0, 0, 0, 0.2)',
                  color: isLightTheme ? '#111' : '#fafafa',
                  outline: 'none',
                }}
              />
            </div>

            {/* 이미지 업로드 */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                이미지 첨부
              </label>
              <ImageUploader
                onImageUpload={handleImageUpload}
                onError={handleImageUploadError}
              />
            </div>

            {/* 마크다운 에디터 */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                내용 (마크다운)
              </label>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="마크다운 형식으로 글을 작성하세요..."
              />
              {uploadedImages.length > 0 && (
                <p
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    opacity: 0.6,
                  }}
                >
                  새로 업로드된 이미지: {uploadedImages.length}개
                </p>
              )}
            </div>

            {/* 발행 여부 */}
            <div
              style={{
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="published"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                발행하기
              </label>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: '24px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {/* 저장 버튼 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: isLightTheme ? '#111' : '#fafafa',
                  color: isLightTheme ? '#fafafa' : '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? '저장 중...' : '수정 완료'}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/posts/${post?.id}`)}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: 'transparent',
                  color: isLightTheme ? '#111' : '#fafafa',
                  border: isLightTheme
                    ? '1px solid rgba(0, 0, 0, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 모달 */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </main>
  );
}
