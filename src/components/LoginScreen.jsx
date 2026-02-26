import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabase'

export default function LoginScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#191919",
      fontFamily: "var(--font-kr)",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "56px 48px",
        width: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        <img src="/logo.png" alt="MyRealTrip" style={{ width: 64, height: 64, marginBottom: 24 }} />
        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: "#191919" }}>
          MyRealTrip
        </h1>
        <p style={{ color: "#737373", fontSize: 14, margin: "0 0 40px", fontWeight: 500 }}>
          내부 조직도 열람 시스템
        </p>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#191919',
                  brandAccent: '#404040',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#F5F5F5',
                  defaultButtonBackgroundHover: '#E5E5E5',
                  defaultButtonBorder: '#E5E5E5',
                  defaultButtonText: '#191919',
                  inputBackground: '#FFFFFF',
                  inputBorder: '#E5E5E5',
                  inputBorderHover: '#191919',
                  inputBorderFocus: '#191919',
                },
                space: {
                  buttonPadding: '12px',
                  inputPadding: '12px',
                },
                fonts: {
                  bodyFontFamily: 'var(--font-kr)',
                  buttonFontFamily: 'var(--font-kr)',
                  inputFontFamily: 'var(--font-kr)',
                  labelFontFamily: 'var(--font-kr)',
                },
                fontSizes: {
                  baseBodySize: '14px',
                  baseInputSize: '14px',
                  baseLabelSize: '13px',
                  baseButtonSize: '14px',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '8px',
                  buttonBorderRadius: '8px',
                  inputBorderRadius: '8px',
                },
              },
            },
            style: {
              button: {
                fontWeight: '600',
              },
              anchor: {
                color: '#191919',
                fontWeight: '600',
              },
              message: {
                fontSize: '13px',
                color: '#737373',
              },
            },
          }}
          providers={['google']}
          onlyThirdPartyProviders
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_in: {
                email_label: '이메일',
                password_label: '비밀번호',
                button_label: '로그인',
                loading_button_label: '로그인 중...',
                social_provider_text: 'Google로 로그인',
                link_text: '이미 계정이 있나요? 로그인',
              },
              sign_up: {
                email_label: '이메일',
                password_label: '비밀번호',
                button_label: '가입하기',
                loading_button_label: '가입 중...',
                social_provider_text: 'Google로 가입',
                link_text: '계정이 없나요? 가입하기',
              },
            },
          }}
        />

        <div style={{
          marginTop: 24,
          padding: "12px 16px",
          background: "#F5F5F5",
          borderRadius: 12,
          fontSize: 12,
          color: "#737373",
          fontWeight: 500,
        }}>
          @myrealtrip.com 계정으로만 접근 가능합니다
        </div>
      </div>
    </div>
  )
}
