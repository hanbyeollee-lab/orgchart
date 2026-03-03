import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 관리자 로그인 컴포넌트
 * 이메일 기반 간단한 인증
 */
export default function AdminLogin({ onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const result = login(email);
    if (result.success) {
      onClose?.();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="admin-login-overlay" onClick={onClose}>
      <div className="admin-login-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-login-header">
          <h2>관리자 로그인</h2>
          <button className="admin-login-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-email">마이리얼트립 이메일</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@myrealtrip.com"
              autoFocus
            />
          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button type="submit" className="admin-login-submit">
            로그인
          </button>

          <p className="admin-login-note">
            권한이 있는 이메일만 관리자로 로그인할 수 있습니다.
          </p>
        </form>
      </div>
    </div>
  );
}
