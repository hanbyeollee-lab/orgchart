# Supabase Auth 설정 가이드

Supabase Auth를 사용하여 Google OAuth를 구현했습니다. 이제 Supabase Dashboard에서 설정만 해주시면 됩니다.

## 1. Supabase Dashboard 접속

https://supabase.com/dashboard/

프로젝트: orgchart-portal 선택

## 2. Authentication 설정

### A. URL Configuration

**Authentication > URL Configuration**으로 이동

**Site URL:**
```
https://orgchart-seven.vercel.app
```

**Redirect URLs 추가:**
```
http://localhost:3000
http://localhost:3001
http://localhost:8080
https://orgchart-seven.vercel.app
https://orgchart-seven.vercel.app/**
```

## 3. Google OAuth Provider 활성화

**Authentication > Providers > Google** 선택

### Enable Google Provider
- "Enable Sign in with Google" 토글 ON

### Google OAuth Credentials

#### Option 1: 기존 Google Client ID 사용 (간단)
1. 현재 `.env` 파일의 `VITE_GOOGLE_CLIENT_ID` 사용
2. **Client ID:**
   ```
   497465255200-6051re1jh770r0r9l4duajd47smkn4vd.apps.googleusercontent.com
   ```
3. **Client Secret:** Google Cloud Console에서 확인 필요

#### Option 2: Supabase가 자동으로 처리 (추천)
1. Google Cloud Console 불필요
2. Supabase에서 자동으로 Google OAuth 설정
3. "Use Supabase's OAuth provider" 선택

### Authorized Client IDs (선택)
특정 Google Workspace 도메인만 허용하려면:
```
myrealtrip.com
```

## 4. 이메일 도메인 제한 (RLS Policy)

Supabase에서 Row Level Security를 사용하여 `@myrealtrip.com` 계정만 접근하도록 제한합니다.

**SQL Editor**에서 실행:

```sql
-- auth.users 테이블에서 myrealtrip.com 도메인만 허용
CREATE POLICY "Allow myrealtrip.com users only"
ON auth.users
FOR ALL
USING (
  email LIKE '%@myrealtrip.com'
);
```

## 5. 환경 변수 확인

`.env` 파일 확인:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Google OAuth는 더 이상 필요 없음 (Supabase가 처리)
```

## 6. 로컬 테스트

```bash
npm run dev -- --port 3001
```

1. http://localhost:3001 접속
2. "Sign in with Google" 클릭
3. @myrealtrip.com 계정으로 로그인
4. 조직도 페이지 접근 확인

## 7. Vercel 배포 확인

Vercel에 배포 후:
1. https://orgchart-seven.vercel.app 접속
2. Google 로그인 테스트
3. 정상 작동 확인

## 장점

✅ **자동 origin 처리**: localhost, Vercel URL 모두 자동 지원
✅ **토큰 관리 자동화**: Access Token, Refresh Token 자동 관리
✅ **세션 관리 내장**: 로그인 상태 유지 자동
✅ **다중 provider 지원**: 나중에 GitHub, Slack 등 추가 가능
✅ **보안 강화**: PKCE flow, secure cookies 기본 제공

## API 접근

Supabase Auth 토큰을 사용하여 다른 앱에서도 접근 가능:

```javascript
// 다른 앱에서 사용
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// API 요청
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/orgchart', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': 'YOUR_ANON_KEY'
  }
})
```

## 문제 해결

### 로그인 후 리디렉트 안 됨
- Redirect URLs에 정확한 URL 추가 확인
- 브라우저 캐시 지우기

### "Invalid redirect URL" 에러
- Supabase Dashboard > Authentication > URL Configuration
- Site URL과 Redirect URLs 정확히 입력

### 도메인 제한이 작동하지 않음
- 코드에서 `isValidDomain` 체크 확인
- `@myrealtrip.com`으로 끝나는지 검증
