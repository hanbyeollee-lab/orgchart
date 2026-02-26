# Google OAuth 설정 가이드

## 에러: origin_mismatch

현재 에러는 Google Cloud Console에서 JavaScript 출처(origin)가 승인되지 않았기 때문입니다.

## 해결 단계

### 1. Google Cloud Console 접속
https://console.cloud.google.com/

### 2. 프로젝트 선택
MyRealTrip 조직도 프로젝트 선택

### 3. API 및 서비스 > 사용자 인증 정보
좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택

### 4. OAuth 2.0 클라이언트 ID 편집
현재 사용 중인 클라이언트 ID 클릭 (`.env` 파일의 `VITE_GOOGLE_CLIENT_ID` 값)

### 5. 승인된 JavaScript 원본 추가

**개발 환경:**
```
http://localhost:3000
http://localhost:3001
http://localhost:8080
```

**프로덕션 환경:**
```
https://orgchart.myrealtrip.com
https://your-production-domain.com
```

### 6. 승인된 리디렉션 URI (필요한 경우)
```
http://localhost:3000
http://localhost:3001
https://orgchart.myrealtrip.com
```

### 7. 저장 후 브라우저 새로고침

## 주의사항

- 변경사항이 적용되려면 최대 5분 정도 소요될 수 있습니다
- 브라우저 캐시를 지우고 다시 시도하세요
- 여러 개의 origin을 추가할 수 있습니다 (개발/프로덕션 모두)

## 현재 .env 설정 확인

```bash
# .env 파일
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 테스트

1. Google Cloud Console 설정 완료
2. 브라우저 캐시 지우기 (Cmd+Shift+Delete)
3. http://localhost:3001 재접속
4. "Sign in with Google" 클릭
5. @myrealtrip.com 계정으로 로그인

## 문제가 계속되는 경우

- 시크릿 모드에서 테스트
- Chrome DevTools > Console에서 에러 메시지 확인
- Google Cloud Console에서 클라이언트 ID 재생성
