'use client';

import React, { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'easymde/dist/easymde.min.css';
import { useTheme } from '@/contexts/ThemeContext';

// SimpleMDE를 동적으로 로드 (SSR 방지)
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = '마크다운으로 작성하세요...',
}: MarkdownEditorProps) {
  const { isLightTheme } = useTheme();

  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
    },
    [onChange]
  );

  const options = useMemo(() => {
    return {
      spellChecker: false,
      placeholder,
      status: false,
      autofocus: true,
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        'code',
        'table',
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide',
      ] as const,
      previewRender: (plainText: string) => {
        // 간단한 마크다운 프리뷰 (react-markdown은 실시간 프리뷰에서 사용)
        return plainText;
      },
    };
  }, [placeholder]);

  return (
    <div
      className="markdown-editor-wrapper"
      style={{
        width: '100%',
        // 테마에 따른 스타일링
        '--md-editor-bg': isLightTheme
          ? 'rgba(255, 255, 255, 0.8)'
          : 'rgba(30, 30, 30, 0.8)',
        '--md-editor-border': isLightTheme
          ? 'rgba(0, 0, 0, 0.1)'
          : 'rgba(255, 255, 255, 0.2)',
        '--md-editor-text': isLightTheme ? '#111' : '#fafafa',
      } as React.CSSProperties}
    >
      <SimpleMDE value={value} onChange={handleChange} options={options} />
      <style jsx global>{`
        .markdown-editor-wrapper .EasyMDEContainer {
          border-radius: 12px;
          overflow: hidden;
        }

        .markdown-editor-wrapper .EasyMDEContainer .CodeMirror {
          background: var(--md-editor-bg);
          color: var(--md-editor-text);
          border: 1px solid var(--md-editor-border);
          border-radius: 12px;
          min-height: 400px;
          font-family: 'Pretendard', -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.7;
        }

        .markdown-editor-wrapper .EasyMDEContainer .CodeMirror-cursor {
          border-left-color: var(--md-editor-text);
        }

        .markdown-editor-wrapper .EasyMDEContainer .editor-toolbar {
          background: var(--md-editor-bg);
          border: 1px solid var(--md-editor-border);
          border-bottom: none;
          border-radius: 12px 12px 0 0;
        }

        .markdown-editor-wrapper .EasyMDEContainer .editor-toolbar button {
          color: var(--md-editor-text) !important;
        }

        .markdown-editor-wrapper .EasyMDEContainer .editor-toolbar button:hover {
          background: ${isLightTheme
            ? 'rgba(0, 0, 0, 0.05)'
            : 'rgba(255, 255, 255, 0.1)'};
        }

        .markdown-editor-wrapper
          .EasyMDEContainer
          .editor-toolbar
          button.active {
          background: ${isLightTheme
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgba(255, 255, 255, 0.15)'};
        }

        .markdown-editor-wrapper .EasyMDEContainer .CodeMirror-selected {
          background: ${isLightTheme
            ? 'rgba(100, 149, 237, 0.2)'
            : 'rgba(100, 149, 237, 0.3)'};
        }

        .markdown-editor-wrapper .editor-preview,
        .markdown-editor-wrapper .editor-preview-side {
          background: var(--md-editor-bg);
          color: var(--md-editor-text);
        }
      `}</style>
    </div>
  );
}
