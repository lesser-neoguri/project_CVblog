'use client';

import { useState, useRef, DragEvent } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { uploadImage, validateImageFile } from '@/lib/storage';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string, markdownText: string) => void;
  onError?: (error: string) => void;
}

export default function ImageUploader({ onImageUpload, onError }: ImageUploaderProps) {
  const { isLightTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      onError?.('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    await handleFiles(imageFiles);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await handleFiles(Array.from(files));
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);

    for (const file of files) {
      // 파일 유효성 검사
      const validation = validateImageFile(file);
      if (!validation.valid) {
        onError?.(validation.error || '파일이 유효하지 않습니다.');
        continue;
      }

      try {
        // 이미지 업로드
        const imageUrl = await uploadImage(file);

        // 마크다운 텍스트 생성
        const altText = file.name.split('.')[0];
        const markdownText = `![${altText}](${imageUrl})`;

        // 콜백 호출
        onImageUpload(imageUrl, markdownText);
      } catch (error: unknown) {
        console.error('업로드 오류:', error);
        onError?.(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
      }
    }

    setIsUploading(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          padding: '32px',
          border: isDragging
            ? '2px dashed #3b82f6'
            : isLightTheme
            ? '2px dashed rgba(0, 0, 0, 0.15)'
            : '2px dashed rgba(255, 255, 255, 0.25)',
          borderRadius: '12px',
          background: isDragging
            ? isLightTheme
              ? 'rgba(59, 130, 246, 0.05)'
              : 'rgba(59, 130, 246, 0.1)'
            : isLightTheme
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(0, 0, 0, 0.2)',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}
      >
        {isUploading ? (
          <div>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(59, 130, 246, 0.3)',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
              업로드 중...
            </p>
          </div>
        ) : (
          <div>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ margin: '0 auto 12px', opacity: 0.5 }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
              이미지를 드래그하거나 클릭하세요
            </p>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>
              JPG, PNG, GIF, WebP (최대 5MB)
            </p>
          </div>
        )}
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
