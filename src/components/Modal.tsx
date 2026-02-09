'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = '확인',
  cancelText = '취소',
}: ModalProps) {
  const { isLightTheme } = useTheme();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* 모달 컨테이너 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: '420px',
            padding: '32px',
            background: isLightTheme
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(40, 40, 40, 0.95)',
            border: isLightTheme
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '20px',
            boxShadow: isLightTheme
              ? '0 20px 60px rgba(0, 0, 0, 0.15)'
              : '0 20px 60px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            animation: 'slideUp 0.3s ease-out',
            position: 'relative',
            zIndex: 9999,
          }}
        >
          {/* 제목 (선택사항) */}
          {title && (
            <h2
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: 700,
                color: isLightTheme ? '#111' : '#fafafa',
              }}
            >
              {title}
            </h2>
          )}

          {/* 메시지 */}
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: '1.6',
              color: isLightTheme ? '#333' : '#ddd',
              marginBottom: '24px',
            }}
          >
            {message}
          </p>

          {/* 버튼 영역 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            {type === 'confirm' && (
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'transparent',
                  color: isLightTheme ? '#666' : '#aaa',
                  border: isLightTheme
                    ? '1px solid rgba(0, 0, 0, 0.15)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLightTheme
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                background: isLightTheme ? '#111' : '#fafafa',
                color: isLightTheme ? '#fafafa' : '#111',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = isLightTheme
                  ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                  : '0 4px 12px rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
