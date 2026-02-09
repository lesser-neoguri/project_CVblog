# CV Blog - 포트폴리오 블로그

대학원 입시 및 취업용 CV 관리 및 마크다운 블로그 시스템입니다.

## 🚀 주요 기능

- **CV 섹션 관리**: 드래그 앤 드롭으로 이력서 섹션 관리 및 정렬
- **커스텀 섹션**: 개인화된 이력서 섹션 추가 및 수정
- **마크다운 블로그**: Supabase 기반의 실시간 마크다운 에디터 및 렌더러
- **프로필 관리**: 학력, 경력, 프로젝트, 기술 스택 등 통합 관리
- **이미지 업로드**: 드래그 앤 드롭 이미지 업로드 (Supabase Storage)
- **반응형 UI**: Glassmorphism 효과와 다크/라이트 모드 지원
- **타입 안전성**: TypeScript + Zod 스키마 검증

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Styling**: Tailwind CSS, Glassmorphism
- **Content**: MDX, gray-matter
- **Markdown**: react-markdown, SimpleMDE, rehype, remark
- **State**: React Context API, Zustand
- **Validation**: Zod

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 CV 관리 페이지
│   ├── posts/              # 블로그 포스트
│   │   ├── page.tsx        # 포스트 목록
│   │   └── [id]/
│   │       ├── page.tsx    # 포스트 상세
│   │       └── edit/
│   │           └── page.tsx # 포스트 수정
│   ├── write/
│   │   └── page.tsx        # 새 포스트 작성
│   ├── profile/
│   │   └── edit/
│   │       └── page.tsx    # 프로필 편집
│   └── search/
│       └── page.tsx        # 검색 페이지
├── components/
│   ├── Navbar.tsx          # 하단 네비게이션 (glassmorphism)
│   ├── MarkdownEditor.tsx  # SimpleMDE 에디터
│   ├── MarkdownRenderer.tsx # Markdown 렌더러
│   ├── ImageUploader.tsx   # 이미지 업로드
│   └── Modal.tsx           # 모달 컴포넌트
├── contexts/
│   └── ThemeContext.tsx    # 테마 관리
├── hooks/
│   └── useModal.tsx        # 모달 훅
└── lib/
    ├── supabase.ts         # Supabase 클라이언트
    ├── posts.ts            # 포스트 CRUD
    ├── profiles.ts         # 프로필 CRUD
    └── storage.ts          # 이미지 업로드/삭제
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Supabase 설정 방법:**

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (또는 새로 생성)
3. Settings → API에서 다음 정보 복사:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**데이터베이스 테이블 생성:**

Supabase 대시보드의 SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- posts 테이블
CREATE TABLE posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT,
  published BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  blocks JSONB,
  images TEXT[]
);

-- profiles 테이블
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  description TEXT,
  website TEXT,
  github TEXT,
  linkedin TEXT,
  education JSONB[],
  experience JSONB[],
  projects JSONB[],
  skills JSONB[],
  awards JSONB[],
  certifications JSONB[],
  publications JSONB[],
  related_courses JSONB[],
  language_tests JSONB[],
  scholarships JSONB[],
  extracurricular JSONB[],
  cv_sections JSONB[],
  custom_sections JSONB[]
);

-- Storage 버킷 생성 (UI에서 생성 필요)
-- 버킷 이름: posts
-- Public 액세스 허용
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 빌드

```bash
npm run build
npm start
```

## ✍️ 사용법

### CV 관리

1. 메인 페이지에서 섹션을 드래그 앤 드롭으로 정렬
2. 섹션 표시/숨김 토글로 원하는 섹션만 표시
3. 커스텀 섹션 추가 및 수정
4. PDF 출력 기능으로 이력서 다운로드

### 블로그 포스트

**글 작성하기:**

1. Navbar에서 **연필 아이콘 (Write)** 클릭
2. 제목, URL 슬러그(선택), 마크다운 내용 작성
3. 이미지 드래그 앤 드롭으로 업로드
4. "발행하기" 체크박스로 발행 여부 선택
5. "저장" 버튼 클릭

**글 목록 보기:**

1. Navbar에서 **목록 아이콘 (Posts)** 클릭
2. 발행된 글만 보기 / 모든 글 보기 토글
3. 글 카드 클릭하여 상세 페이지로 이동

**글 수정/삭제:**

1. 글 상세 페이지에서 "수정" 버튼 클릭
2. 내용 수정 후 "수정 완료" 버튼 클릭
3. 삭제는 "삭제" 버튼 클릭 후 확인

### 프로필 관리

1. Navbar에서 **프로필 아이콘** 클릭
2. 기본 정보, 학력, 경력, 프로젝트 등 입력
3. 프로필 사진 업로드 (드래그 앤 드롭)
4. 기술 스택 태그 추가
5. "저장" 버튼으로 프로필 업데이트

### 검색

1. Navbar에서 **검색 아이콘** 클릭
2. 키워드로 포스트 및 프로필 검색
3. 필터 옵션으로 검색 결과 정제

### 마크다운 문법

SimpleMDE 에디터가 다음 마크다운 기능을 지원합니다:

- **제목**: `# H1`, `## H2`, `### H3`
- **강조**: `**굵게**`, `*기울임*`
- **목록**: `- 항목`, `1. 번호`
- **링크**: `[텍스트](URL)`
- **이미지**: `![alt](URL)`
- **코드**: `` `인라인` ``, ` ```언어\n코드블록\n``` `
- **인용**: `> 인용문`
- **표**: 마크다운 테이블 문법

## 🎨 UI/UX 특징

- **Glassmorphism**: 반투명 배경과 블러 효과
- **다크/라이트 모드**: 자동 테마 전환 지원
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화
- **부드러운 애니메이션**: GSAP 기반 인터랙션
- **하단 네비게이션**: 스크롤 시 자동 숨김/표시

## 🔧 개발

### 새로운 컴포넌트 추가

1. `src/components/`에 컴포넌트 파일 생성
2. TypeScript 타입 정의 (필요시 `src/lib/supabase.ts`에 추가)
3. 필요한 경우 Zustand 스토어 추가

### 스타일링

Tailwind CSS 클래스를 사용하여 스타일링하세요. 다크모드는 `dark:` 접두사를 사용합니다.

## 📦 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 연결
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 자동 배포 완료

### 환경 변수

Vercel 대시보드:
1. Project Settings → Environment Variables
2. 위 변수들을 추가
3. 재배포

## 🐛 문제 해결

### 일반적인 문제

1. **Supabase 연결 오류**
   - 환경 변수가 올바르게 설정되었는지 확인
   - Supabase 프로젝트가 활성화되어 있는지 확인

2. **이미지 업로드 실패**
   - Supabase Storage 버킷이 생성되었는지 확인
   - 버킷이 Public으로 설정되었는지 확인
   - 파일 크기가 5MB 이하인지 확인

3. **빌드 실패**
   - TypeScript 오류 확인
   - 의존성이 올바르게 설치되었는지 확인

### 성능 최적화

- 이미지 최적화: Next.js Image 컴포넌트 사용
- 코드 스플리팅: dynamic import 활용
- 메모이제이션: `useMemo`, `useCallback` 활용

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [react-markdown 문서](https://github.com/remarkjs/react-markdown)

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.

---

**즐거운 블로깅 되세요! 🎉**
