import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 로그인 페이지 컴포넌트
 * @myrealtrip.com 계정으로만 로그인 가능
 */
export default function LoginPage() {
  const { handleGoogleSuccess, ALLOWED_DOMAIN } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      const result = await handleGoogleSuccess(tokenResponse);
      if (!result.success) {
        setError(result.error);
      }
      setIsLoading(false);
    },
    onError: () => {
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    },
  });

  const handleLogin = () => {
    setError(null);
    login();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo-white.png" alt="마이리얼트립" />
        </div>

        <h1 className="login-title">조직도</h1>
        <p className="login-subtitle">
          마이리얼트립 구성원을 위한 내부 서비스입니다.
        </p>

        <button
          className="login-google-btn"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <span>로그인 중...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google 계정으로 로그인</span>
            </>
          )}
        </button>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <p className="login-notice">
          @{ALLOWED_DOMAIN} 계정만 접근 가능합니다.
        </p>
      </div>

      <footer className="login-footer">
        © 2026 MyRealTrip — For Internal Use Only
      </footer>
    </div>
  );
}
