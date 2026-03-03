import { useState, useMemo } from 'react';
import { addEmployee, updateEmployee, extractOrganizations, extractTitles } from '../../utils/dataManager';

/**
 * 직원 추가/수정 폼 컴포넌트
 */
export default function EmployeeForm({ employee, orgData, onSubmit, onClose }) {
  const isEdit = !!employee;

  const [formData, setFormData] = useState({
    name: employee?.name || '',
    org_1: employee?.org_1 || '',
    org_2: employee?.org_2 || '',
    title: employee?.title || '',
    jobTitle: employee?.jobTitle || '',
    status: employee?.status || '재직',
    concurrent: employee?.concurrent || '',
  });

  const [errors, setErrors] = useState({});

  // 기존 조직/직책 목록 추출
  const { divisions, teams } = useMemo(() => extractOrganizations(orgData), [orgData]);
  const titles = useMemo(() => extractTitles(orgData), [orgData]);

  // 입력값 변경
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // 폼 검증
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.org_1.trim()) {
      newErrors.org_1 = '실(조직)을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    let result;
    if (isEdit) {
      result = updateEmployee(orgData, employee.id || employee.name, formData);
    } else {
      result = addEmployee(orgData, formData);
    }

    if (result.success) {
      onSubmit(result.data);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="admin-form-overlay" onClick={onClose}>
      <div className="admin-form-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-form-header">
          <h3>{isEdit ? '직원 수정' : '직원 추가'}</h3>
          <button className="admin-login-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          {/* 이름 */}
          <div className="admin-form-field">
            <label>이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="홍길동"
              autoFocus
            />
            {errors.name && <span className="admin-form-error">{errors.name}</span>}
          </div>

          {/* 실 (org_1) */}
          <div className="admin-form-field">
            <label>실 (조직) *</label>
            <input
              type="text"
              list="divisions-list"
              value={formData.org_1}
              onChange={(e) => handleChange('org_1', e.target.value)}
              placeholder="Flight실"
            />
            <datalist id="divisions-list">
              {divisions.map(div => (
                <option key={div} value={div} />
              ))}
            </datalist>
            {errors.org_1 && <span className="admin-form-error">{errors.org_1}</span>}
          </div>

          {/* 팀 (org_2) */}
          <div className="admin-form-field">
            <label>팀</label>
            <input
              type="text"
              list="teams-list"
              value={formData.org_2}
              onChange={(e) => handleChange('org_2', e.target.value)}
              placeholder="항공개발팀"
            />
            <datalist id="teams-list">
              {teams.map(team => (
                <option key={team} value={team} />
              ))}
            </datalist>
          </div>

          {/* 직책 */}
          <div className="admin-form-field">
            <label>직책</label>
            <input
              type="text"
              list="titles-list"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="매니저"
            />
            <datalist id="titles-list">
              {titles.map(title => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </div>

          {/* 직무 */}
          <div className="admin-form-field">
            <label>직무</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              placeholder="백엔드 개발자"
            />
          </div>

          {/* 상태 */}
          <div className="admin-form-field">
            <label>상태</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="재직">재직</option>
              <option value="휴직">휴직</option>
              <option value="퇴사">퇴사</option>
              <option value="입사예정">입사예정</option>
            </select>
          </div>

          {/* 겸직 */}
          <div className="admin-form-field">
            <label>겸직</label>
            <input
              type="text"
              value={formData.concurrent}
              onChange={(e) => handleChange('concurrent', e.target.value)}
              placeholder="마이팩실장 겸직"
            />
          </div>

          {/* 버튼 */}
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              {isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
