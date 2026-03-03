import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteEmployee, resetToOriginal, hasCustomData, extractOrganizations } from '../../utils/dataManager';
import EmployeeForm from './EmployeeForm';

/**
 * 관리자 패널 컴포넌트
 * 직원 목록 조회, 추가, 수정, 삭제 기능
 */
export default function AdminPanel({ orgData, onDataChange, onClose }) {
  const { logout, adminEmail } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // 조직 목록 추출
  const { divisions, teams } = useMemo(() => {
    return extractOrganizations(orgData);
  }, [orgData]);

  // 필터링된 직원 목록
  const filteredEmployees = useMemo(() => {
    let result = [...orgData];

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp =>
        emp.name?.toLowerCase().includes(query) ||
        emp.org_1?.toLowerCase().includes(query) ||
        emp.org_2?.toLowerCase().includes(query) ||
        emp.title?.toLowerCase().includes(query)
      );
    }

    // 조직 필터
    if (filterOrg) {
      result = result.filter(emp =>
        emp.org_1 === filterOrg || emp.org_2 === filterOrg
      );
    }

    // 이름순 정렬
    return result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  }, [orgData, searchQuery, filterOrg]);

  // 직원 삭제
  const handleDelete = (employee) => {
    const result = deleteEmployee(orgData, employee.id || employee.name);
    if (result.success) {
      onDataChange(result.data);
      setConfirmDelete(null);
    } else {
      alert(result.error);
    }
  };

  // 데이터 초기화
  const handleReset = () => {
    if (confirm('모든 수정사항을 삭제하고 원본 데이터로 복원하시겠습니까?')) {
      resetToOriginal();
      onDataChange(null); // null을 전달하면 원본 데이터 사용
    }
  };

  // 폼 제출 후 처리
  const handleFormSubmit = (newData) => {
    onDataChange(newData);
    setShowForm(false);
    setEditingEmployee(null);
  };

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="admin-panel-header">
          <div className="admin-panel-title">
            <h2>조직도 관리</h2>
            <span className="admin-panel-user">{adminEmail}</span>
          </div>
          <div className="admin-panel-actions">
            <button className="admin-btn admin-btn-secondary" onClick={logout}>
              로그아웃
            </button>
            <button className="admin-btn admin-btn-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 툴바 */}
        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <input
              type="text"
              className="admin-search-input"
              placeholder="이름, 조직, 직책 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="admin-filter-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
            >
              <option value="">전체 조직</option>
              <optgroup label="실">
                {divisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </optgroup>
              <optgroup label="팀">
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="admin-toolbar-right">
            {hasCustomData() && (
              <button className="admin-btn admin-btn-warning" onClick={handleReset}>
                원본 복원
              </button>
            )}
            <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(true)}>
              + 직원 추가
            </button>
          </div>
        </div>

        {/* 직원 목록 */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>실</th>
                <th>팀</th>
                <th>직책</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, index) => (
                <tr key={emp.id || emp.name || index}>
                  <td className="admin-table-name">{emp.name}</td>
                  <td>{emp.org_1 || '-'}</td>
                  <td>{emp.org_2 || '-'}</td>
                  <td>{emp.title || '-'}</td>
                  <td>
                    <span className={`admin-status admin-status-${emp.status === '재직' ? 'active' : emp.status === '휴직' ? 'leave' : 'inactive'}`}>
                      {emp.status || '재직'}
                    </span>
                  </td>
                  <td className="admin-table-actions">
                    <button
                      className="admin-btn-icon"
                      onClick={() => {
                        setEditingEmployee(emp);
                        setShowForm(true);
                      }}
                      title="수정"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      className="admin-btn-icon admin-btn-danger"
                      onClick={() => setConfirmDelete(emp)}
                      title="삭제"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="admin-empty">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="admin-panel-footer">
          <span>총 {filteredEmployees.length}명 / 전체 {orgData.length}명</span>
        </div>
      </div>

      {/* 직원 추가/수정 폼 모달 */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          orgData={orgData}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-modal">
            <h3>직원 삭제</h3>
            <p><strong>{confirmDelete.name}</strong>님을 삭제하시겠습니까?</p>
            <div className="admin-confirm-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                취소
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => handleDelete(confirmDelete)}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
