import { useState, useEffect } from 'react';
import { OrgChart } from './components/OrgChart';
import { buildOrgTree } from './utils/orgParser';
import orgData from './data/orgData.json';
import './App.css';

export default function App() {
  const [orgTree, setOrgTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제 데이터로 트리 구조 생성
    const tree = buildOrgTree(orgData);
    setOrgTree(tree);
    setLoading(false);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <img src="/logo-white.png" alt="마이리얼트립" className="header-logo" />
        </div>
        <div className="header-right">
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
    </div>
  );
}
