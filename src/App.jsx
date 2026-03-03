import { useState, useEffect } from 'react';
import { OrgChart } from './components/OrgChart';
import { buildOrgTree } from './utils/orgParser';
import { loadCustomOrgData, saveOrgData } from './utils/dataManager';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/Auth';
import { AdminPanel } from './components/Admin';
import originalOrgData from './data/orgData.json';
import './App.css';

function AppContent() {
  const [orgData, setOrgData] = useState(null);
  const [orgTree, setOrgTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const { isAuthenticated, isAdmin, user, logout, loading: authLoading } = useAuth();

  // 초기 데이터 로드
  useEffect(() => {
    const customData = loadCustomOrgData();
    const dataToUse = customData || originalOrgData;
    setOrgData(dataToUse);

    const tree = buildOrgTree(dataToUse);
    setOrgTree(tree);
    setLoading(false);
  }, []);

  // 데이터 변경 시 트리 재생성
  const handleDataChange = (newData) => {
    if (newData === null) {
      // 원본 복원
      setOrgData(originalOrgData);
      const tree = buildOrgTree(originalOrgData);
      setOrgTree(tree);
    } else {
      setOrgData(newData);
      saveOrgData(newData);
      const tree = buildOrgTree(newData);
      setOrgTree(tree);
    }
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="app-container">
        <div className="loading-state" style={{ height: '100vh' }}>
          <div className="loading-spinner" />
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지 표시
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <img src="/logo-white.png" alt="마이리얼트립" className="header-logo" />
        </div>
        <div className="header-right">
          {isAdmin && (
            <button
              className="admin-header-btn"
              onClick={() => setShowAdminPanel(true)}
            >
              관리자
            </button>
          )}
          <div className="header-user">
            {user?.picture && (
              <img src={user.picture} alt="" className="header-user-avatar" />
            )}
            <span className="header-user-name">{user?.name || user?.email}</span>
            <button className="header-logout-btn" onClick={logout}>
              로그아웃
            </button>
          </div>
          <span className="internal-badge">For Internal Use Only</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>조직도를 불러오는 중...</p>
          </div>
        ) : orgTree ? (
          <OrgChart data={orgTree} rawData={orgData} />
        ) : (
          <div className="empty-state">
            <h2>조직 데이터가 없습니다</h2>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        © 2026 MyRealTrip — 내부 전용
      </footer>

      {/* 관리자 패널 */}
      {showAdminPanel && isAdmin && orgData && (
        <AdminPanel
          orgData={orgData}
          onDataChange={handleDataChange}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
