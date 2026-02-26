# MyRealTrip 조직도 포털

마이리얼트립 내부 조직도 열람 시스템

## 기능

- **Google OAuth 로그인** (@myrealtrip.com 도메인 제한)
- **PDF 조직도 뷰어** (마우스 휠 확대/축소)
- **관리자 권한** (조직도 업로드/삭제)
- **API 엔드포인트** (다른 앱에서 접근 가능)
- **브랜드 디자인** (MyRealTrip 로고, Pretendard 폰트, #191919 컬러)

## 기술 스택

- **Frontend:** React 19 + Vite
- **Auth:** Supabase Auth (Google OAuth)
- **Storage:** Supabase Storage
- **API:** Supabase Edge Functions
- **Deployment:** Vercel

## 시작하기

### 1. 환경 변수 설정

`.env` 파일 생성:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev -- --port 3001
```

http://localhost:3001 접속

### 4. 빌드

```bash
npm run build
```

## Supabase 설정

### 1. Authentication 설정

**Supabase Dashboard > Authentication > URL Configuration**

- **Site URL:** `https://orgchart-seven.vercel.app`
- **Redirect URLs:**
  - `http://localhost:3000`
  - `http://localhost:3001`
  - `https://orgchart-seven.vercel.app`
  - `https://orgchart-seven.vercel.app/**`

### 2. Google OAuth Provider 활성화

**Authentication > Providers > Google**

- Enable Sign in with Google: ON
- Use Supabase's OAuth provider (추천)

### 3. Storage Bucket 생성

**Storage > Create Bucket**

- **Name:** `orgchart`
- **Public:** Yes (RLS로 접근 제어)

### 4. Edge Function 배포

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# Functions 배포
supabase functions deploy orgchart-api
```

자세한 설정은 [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) 참조

## API 사용

다른 애플리케이션에서 조직도에 접근하려면 [API_GUIDE.md](./API_GUIDE.md)를 참조하세요.

### 빠른 시작

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 로그인
await supabase.auth.signInWithOAuth({ provider: 'google' })

// 메타데이터 조회
const { data: { session } } = await supabase.auth.getSession()
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/orgchart-api/meta`,
  {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY
    }
  }
)
const meta = await response.json()
```

## 보안

### 접근 제어
- @myrealtrip.com 도메인만 접근 가능
- Supabase Auth JWT 토큰 검증
- 관리자 이메일 화이트리스트

### 관리자
- hanbyeol.lee@myrealtrip.com
- haein.cho@myrealtrip.com
- yoonjae.lee@myrealtrip.com

### 추가 보안 (RLS)
`supabase-rls.sql` 파일로 Row Level Security 정책 설정 가능

## 프로젝트 구조

```
orgchart-portal/
├── public/
│   └── logo.png                    # MyRealTrip 로고
├── src/
│   ├── components/
│   │   └── LoginScreen.jsx         # 로그인 화면
│   ├── App.jsx                     # 메인 앱
│   ├── supabase.js                 # Supabase 클라이언트
│   ├── index.css                   # 글로벌 스타일
│   └── main.jsx                    # 엔트리 포인트
├── supabase/
│   └── functions/
│       └── orgchart-api/
│           └── index.ts            # API 엔드포인트
├── .env                            # 환경 변수
├── API_GUIDE.md                    # API 사용 가이드
├── SUPABASE_AUTH_SETUP.md          # Supabase 설정 가이드
├── supabase-rls.sql                # RLS 정책
└── README.md
```

## 주요 기능

### 1. 로그인
- Supabase Auth + Google OAuth
- @myrealtrip.com 도메인 제한
- 브랜드 디자인 로그인 화면

### 2. PDF 뷰어
- **Ctrl + 마우스 휠**: 확대/축소 (50% ~ 300%)
- **우측 하단 컨트롤**: +/- 버튼, 100% 리셋
- 다운로드/인쇄 방지

### 3. 관리자 기능
- 조직도 업로드 (PDF)
- 조직도 삭제
- 메타데이터 관리

### 4. API
- 접근 권한 확인 (`/check`)
- 메타데이터 조회 (`/meta`)
- PDF 다운로드 (`/download`)

## 배포

### Vercel
```bash
# Vercel 배포 (자동)
git push origin main

# 환경 변수 설정
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

현재 배포 URL: https://orgchart-seven.vercel.app

### Supabase Functions
```bash
supabase functions deploy orgchart-api
```

## 문의

- 기술 문의: hanbyeol.lee@myrealtrip.com
- 조직도 업데이트: HR 팀
- 접근 권한 문제: IT 팀

---

© 2026 MyRealTrip — For Internal Use Only
