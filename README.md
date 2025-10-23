# CV Blog - 그래프형 블로그

나(중심 노드)를 기준으로, 분류(논문리뷰/프로젝트/개념/기술노트)마다 '중력(이끌림)'이 적용되는 동적 그래프형 CV 블로그입니다.

## 🚀 주요 기능

- **3D 그래프 시각화**: `react-force-graph-3d`를 사용한 인터랙티브 그래프
- **카테고리별 중력**: 슬라이더로 조절 가능한 카테고리별 군집 효과
- **실시간 필터링**: 카테고리, 태그, 타입, 연결 강도별 필터링
- **MDX 콘텐츠**: 마크다운 + JSX를 지원하는 콘텐츠 시스템
- **반응형 UI**: Tailwind CSS + 다크모드 지원
- **타입 안전성**: TypeScript + Zod 스키마 검증

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Graph**: react-force-graph-3d, Three.js
- **Content**: MDX, gray-matter
- **State**: Zustand
- **Validation**: Zod

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 그래프 페이지
│   └── [slug]/
│       └── page.tsx        # 개별 콘텐츠 페이지
├── components/
│   ├── GraphCanvas.tsx     # 3D 그래프 캔버스
│   ├── FiltersPanel.tsx    # 필터 패널
│   ├── CategoryLegend.tsx  # 범례
│   ├── GravityControl.tsx  # 중력 조절
│   └── MDXContent.tsx      # MDX 렌더러
├── lib/
│   ├── mdx.ts              # MDX 파일 처리
│   ├── graph.ts            # 그래프 데이터 생성
│   └── store.ts            # Zustand 상태 관리
└── types/
    └── index.ts            # TypeScript 타입 정의

content/                    # MDX 콘텐츠 파일들
├── me.mdx                  # 자기소개 (중심 노드)
├── soft-robotics-vla.mdx   # 논문 리뷰
└── vla-basics.mdx          # 개념 정리
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 3. 빌드

```bash
npm run build
npm start
```

## 📝 콘텐츠 작성

### MDX 파일 구조

`content/` 디렉토리에 `.mdx` 파일을 생성하고 다음 frontmatter 형식을 따르세요:

```yaml
---
title: "글 제목"
slug: "unique-slug"
type: "paperReview" # paperReview | project | concept | post | person | category
category: ["논문리뷰", "로보틱스", "AI"]
date: "2025-10-01"
tags: ["VLA", "Soft Robotics"]
links:
  - type: "buildsOn" # cites | buildsOn | references | derivedFrom | related
    to: "other-slug"
    weight: 0.8
external:
  doi: "10.1234/abcd.efgh"
  github: "https://github.com/username/repo"
  demo: "https://demo.example.com"
---

# 마크다운 콘텐츠

여기에 MDX 콘텐츠를 작성하세요.
```

### 필수 파일

- **`me.mdx`**: `type: "person"`으로 설정된 자기소개 파일 (중심 노드)

### 노드 타입별 색상

- 🔵 **person**: 파란색 (중심 노드)
- 🔴 **paperReview**: 빨간색 (논문 리뷰)
- 🟢 **project**: 초록색 (프로젝트)
- 🟡 **concept**: 노란색 (개념)
- 🟣 **post**: 보라색 (일반 포스트)
- ⚫ **category**: 회색 (카테고리)

## 🎮 사용법

### 그래프 조작

- **드래그**: 노드를 드래그하여 위치 조정
- **줌**: 마우스 휠로 확대/축소
- **회전**: 마우스 드래그로 3D 회전
- **클릭**: 노드 클릭 시 상세 페이지로 이동

### 필터링

- **카테고리 필터**: 특정 카테고리의 노드만 표시
- **타입 필터**: 특정 타입의 노드만 표시
- **태그 필터**: 특정 태그가 있는 노드만 표시
- **연결 강도**: 가중치 범위로 링크 필터링

### 중력 조절

- **분산 (0)**: 노드들이 자유롭게 분산
- **군집 (1)**: 카테고리별로 강하게 군집

## 🔧 개발

### 새로운 컴포넌트 추가

1. `src/components/`에 컴포넌트 파일 생성
2. TypeScript 타입 정의 (필요시 `src/types/`에 추가)
3. 필요한 경우 Zustand 스토어 업데이트

### 그래프 알고리즘 수정

`src/lib/graph.ts`에서 다음 함수들을 수정:

- `buildGraph()`: MDX → 그래프 데이터 변환
- `getCategoryAnchors()`: 카테고리별 앵커 포인트
- `filterGraphData()`: 필터링 로직

### 스타일링

Tailwind CSS 클래스를 사용하여 스타일링하세요. 다크모드는 `dark:` 접두사를 사용합니다.

## 📦 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 연결
3. 자동 배포 완료

### 환경 변수

현재는 환경 변수가 필요하지 않지만, 향후 Supabase 연동 시 다음이 필요할 수 있습니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🐛 문제 해결

### 일반적인 문제

1. **MDX 파일이 로드되지 않음**
   - `content/` 디렉토리에 파일이 있는지 확인
   - frontmatter 형식이 올바른지 확인
   - `slug`가 고유한지 확인

2. **그래프가 표시되지 않음**
   - 브라우저 콘솔에서 오류 확인
   - `me.mdx` 파일이 존재하는지 확인
   - Node.js 버전이 18+ 인지 확인

3. **빌드 실패**
   - TypeScript 오류 확인
   - MDX 파일의 frontmatter 스키마 검증 오류 확인

### 성능 최적화

- 노드 수가 많을 경우 (100+): `GraphCanvas.tsx`에서 렌더링 최적화 옵션 조정
- 메모리 사용량: 불필요한 리렌더링 방지를 위한 `useMemo`, `useCallback` 활용

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [react-force-graph 문서](https://github.com/vasturiano/react-force-graph)
- [MDX 공식 문서](https://mdxjs.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Zustand 문서](https://github.com/pmndrs/zustand)

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.

---

**즐거운 블로깅 되세요! 🎉**