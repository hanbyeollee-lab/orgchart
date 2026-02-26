// Supabase Edge Function: orgchart-api
// 다른 앱에서 조직도 데이터에 안전하게 접근

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_DOMAIN = 'myrealtrip.com'
const BUCKET = 'orgchart'
const FILE_PATH = 'current.pdf'
const META_PATH = 'meta.json'

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // 사용자 정보 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 도메인 체크
    const email = user.email || ''
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized domain',
          message: `Only @${ALLOWED_DOMAIN} accounts are allowed`
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 요청 경로에 따라 처리
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'meta':
        // 메타데이터 조회
        return await handleGetMeta(supabase)

      case 'download':
        // PDF 다운로드 (Signed URL)
        return await handleDownload(supabase, user)

      case 'check':
        // 접근 권한 확인
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              email: user.email,
              domain: ALLOWED_DOMAIN,
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid endpoint',
            available: ['meta', 'download', 'check']
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleGetMeta(supabase: any) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(META_PATH)

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Meta file not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const text = await data.text()
  const meta = JSON.parse(text)

  // 접근 로그 (선택)
  console.log(`[META] Accessed by: ${meta.uploadedBy}`)

  return new Response(
    JSON.stringify(meta),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleDownload(supabase: any, user: any) {
  // Signed URL 생성 (1시간 유효)
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(FILE_PATH, 3600)

  if (error) {
    return new Response(
      JSON.stringify({ error: 'PDF file not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // 접근 로그
  console.log(`[DOWNLOAD] ${user.email} - ${new Date().toISOString()}`)

  return new Response(
    JSON.stringify({
      url: data.signedUrl,
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
