import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// 허용 도메인
const ALLOWED_DOMAIN = 'myrealtrip.com';

// 관리자 권한이 있는 이메일 목록
const ADMIN_EMAILS = [
  'hanbyeol.lee@myrealtrip.com',
  'haein.cho@myrealtrip.com',
  'yoonjae.lee@myrealtrip.com'
];

const AUTH_STORAGE_KEY = 'orgchart_user';

const AuthContext = createContext(null);

function AuthProviderInner({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 로드 시 localStorage에서 인증 상태 복원
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.email && userData.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdmin(ADMIN_EMAILS.includes(userData.email.toLowerCase()));
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Google 로그인 성공 콜백
  const handleGoogleSuccess = useCallback(async (tokenResponse) => {
    try {
      // Google API로 사용자 정보 가져오기
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });
      const userInfo = await res.json();

      // 이메일 도메인 확인
      if (!userInfo.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        throw new Error('INVALID_DOMAIN');
      }

      const userData = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(ADMIN_EMAILS.includes(userData.email.toLowerCase()));

      return { success: true };
    } catch (error) {
      if (error.message === 'INVALID_DOMAIN') {
        return { success: false, error: `@${ALLOWED_DOMAIN} 계정만 접근 가능합니다.` };
      }
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  }, []);

  // 로그아웃
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      loading,
      handleGoogleSuccess,
      logout,
      ADMIN_EMAILS,
      ALLOWED_DOMAIN
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    // 개발 모드에서 Client ID 없으면 경고
    console.warn('VITE_GOOGLE_CLIENT_ID not set. Using demo mode.');
    return (
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Google 로그인 버튼 hook
export function useGoogleAuth() {
  const { handleGoogleSuccess } = useAuth();
  const [error, setError] = useState(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await handleGoogleSuccess(tokenResponse);
      if (!result.success) {
        setError(result.error);
      }
    },
    onError: () => {
      setError('Google 로그인에 실패했습니다.');
    },
  });

  return { login, error, setError };
}
