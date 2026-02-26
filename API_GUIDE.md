# 조직도 API 가이드

다른 애플리케이션에서 MyRealTrip 조직도에 안전하게 접근할 수 있는 API입니다.

## 인증

Supabase Auth를 사용하여 @myrealtrip.com 계정만 접근 가능합니다.

## Base URL

```
https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api
```

## 엔드포인트

### 1. 접근 권한 확인

**GET** `/check`

현재 로그인한 사용자의 접근 권한을 확인합니다.

**Request:**
```bash
curl -X GET \
  'https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api/check' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "hanbyeol.lee@myrealtrip.com",
    "domain": "myrealtrip.com"
  }
}
```

### 2. 메타데이터 조회

**GET** `/meta`

조직도 파일의 메타데이터를 조회합니다.

**Request:**
```bash
curl -X GET \
  'https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api/meta' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY'
```

**Response:**
```json
{
  "name": "조직도_2026_Q1.pdf",
  "uploadedBy": "hanbyeol.lee@myrealtrip.com",
  "uploadedAt": "2026. 2. 26. 오전 11:30:00",
  "url": "https://..."
}
```

### 3. PDF 다운로드

**GET** `/download`

조직도 PDF의 임시 다운로드 링크(Signed URL)를 생성합니다.

**Request:**
```bash
curl -X GET \
  'https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api/download' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY'
```

**Response:**
```json
{
  "url": "https://...signed-url...",
  "expiresIn": 3600,
  "expiresAt": "2026-02-26T03:30:00.000Z"
}
```

**보안:**
- Signed URL은 1시간 동안만 유효
- 다운로드 시마다 새로운 URL 생성
- 모든 접근 로그 기록

---

## 사용 예제

### JavaScript/TypeScript (React, Next.js, Node.js)

```typescript
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화
const supabase = createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_ANON_KEY'
)

// 1. 로그인
async function login() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  })
}

// 2. 조직도 메타데이터 조회
async function getOrgchartMeta() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    'https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api/meta',
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'YOUR_ANON_KEY'
      }
    }
  )

  return await response.json()
}

// 3. PDF 다운로드 링크 생성
async function getDownloadUrl() {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    'https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api/download',
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'YOUR_ANON_KEY'
      }
    }
  )

  const { url } = await response.json()

  // PDF 다운로드 또는 표시
  window.open(url, '_blank')
}

// 4. 접근 권한 확인
async function checkAccess() {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    'https://YOUR_PROJECT.supabase.co/functions/v1/orgchart-api/check',
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'YOUR_ANON_KEY'
      }
    }
  )

  const result = await response.json()
  console.log('Access:', result.success)
  console.log('User:', result.user.email)
}
```

### React 컴포넌트 예제

```tsx
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OrgchartViewer() {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrgchart()
  }, [])

  async function loadOrgchart() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // 로그인 필요
        await supabase.auth.signInWithOAuth({ provider: 'google' })
        return
      }

      // 메타데이터 조회
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orgchart-api/meta`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          }
        }
      )

      const data = await response.json()
      setMeta(data)
    } catch (error) {
      console.error('Failed to load orgchart:', error)
    } finally {
      setLoading(false)
    }
  }

  async function downloadPdf() {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orgchart-api/download`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        }
      }
    )

    const { url } = await response.json()
    window.open(url, '_blank')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>조직도</h1>
      {meta && (
        <>
          <p>파일명: {meta.name}</p>
          <p>업로드: {meta.uploadedBy}</p>
          <p>날짜: {meta.uploadedAt}</p>
          <button onClick={downloadPdf}>PDF 다운로드</button>
        </>
      )}
    </div>
  )
}
```

### Python 예제

```python
import requests
import os

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

def get_orgchart_meta(access_token):
    """조직도 메타데이터 조회"""
    response = requests.get(
        f'{SUPABASE_URL}/functions/v1/orgchart-api/meta',
        headers={
            'Authorization': f'Bearer {access_token}',
            'apikey': SUPABASE_ANON_KEY
        }
    )
    return response.json()

def download_orgchart(access_token, output_path='orgchart.pdf'):
    """조직도 PDF 다운로드"""
    # 1. Signed URL 생성
    response = requests.get(
        f'{SUPABASE_URL}/functions/v1/orgchart-api/download',
        headers={
            'Authorization': f'Bearer {access_token}',
            'apikey': SUPABASE_ANON_KEY
        }
    )

    data = response.json()
    signed_url = data['url']

    # 2. PDF 다운로드
    pdf_response = requests.get(signed_url)

    with open(output_path, 'wb') as f:
        f.write(pdf_response.content)

    print(f'Downloaded to {output_path}')

# 사용 예
if __name__ == '__main__':
    # 주의: access_token은 별도로 획득해야 함
    access_token = 'YOUR_ACCESS_TOKEN'

    meta = get_orgchart_meta(access_token)
    print(f"파일: {meta['name']}")
    print(f"업로드: {meta['uploadedBy']}")

    download_orgchart(access_token)
```

---

## 보안

### 접근 제어
- ✅ @myrealtrip.com 도메인만 허용
- ✅ Supabase Auth JWT 토큰 검증
- ✅ Signed URL (1시간 유효)
- ✅ CORS 제한

### 로깅
모든 API 요청은 서버 로그에 기록됩니다:
```
[META] Accessed by: hanbyeol.lee@myrealtrip.com
[DOWNLOAD] hanbyeol.lee@myrealtrip.com - 2026-02-26T02:30:00.000Z
```

### Rate Limiting (선택)
필요시 Supabase Dashboard에서 설정 가능

---

## 배포

### Supabase CLI 설치
```bash
npm install -g supabase
```

### 로그인
```bash
supabase login
```

### Functions 배포
```bash
cd /Users/hanbyeol-lee/orgchart-portal
supabase functions deploy orgchart-api
```

### 환경 변수 설정
Supabase Dashboard에서 자동으로 설정됨:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 문제 해결

### 401 Unauthorized
- Access Token이 만료되었거나 유효하지 않음
- `supabase.auth.getSession()`으로 새 토큰 획득

### 403 Forbidden
- @myrealtrip.com 계정이 아님
- 허용된 도메인으로 다시 로그인

### 404 Not Found
- 조직도 파일이 업로드되지 않음
- 관리자에게 문의

### CORS Error
- API 엔드포인트 URL 확인
- Authorization 헤더 포함 확인

---

## 연락처

문제가 발생하면 HR 팀에 문의해주세요:
- hanbyeol.lee@myrealtrip.com
- haein.cho@myrealtrip.com
- yoonjae.lee@myrealtrip.com
