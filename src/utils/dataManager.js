/**
 * 조직도 데이터 관리 유틸리티
 * localStorage 기반 CRUD 작업
 */

const STORAGE_KEY = 'orgchart_data';
const STORAGE_VERSION_KEY = 'orgchart_data_version';

/**
 * 데이터 불러오기
 * localStorage에 저장된 데이터가 있으면 반환, 없으면 null
 */
export function loadCustomOrgData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return null;
  }
}

/**
 * 데이터 저장하기
 */
export function saveOrgData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_VERSION_KEY, new Date().toISOString());
    return { success: true };
  } catch (error) {
    console.error('데이터 저장 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 직원 추가
 */
export function addEmployee(data, employee) {
  const newEmployee = {
    ...employee,
    id: employee.id || generateId()
  };
  const newData = [...data, newEmployee];
  const result = saveOrgData(newData);
  if (result.success) {
    return { success: true, data: newData };
  }
  return result;
}

/**
 * 직원 수정
 */
export function updateEmployee(data, employeeId, updates) {
  const index = data.findIndex(emp => emp.id === employeeId || emp.name === employeeId);
  if (index === -1) {
    return { success: false, error: '직원을 찾을 수 없습니다.' };
  }

  const newData = [...data];
  newData[index] = { ...newData[index], ...updates };

  const result = saveOrgData(newData);
  if (result.success) {
    return { success: true, data: newData };
  }
  return result;
}

/**
 * 직원 삭제
 */
export function deleteEmployee(data, employeeId) {
  const index = data.findIndex(emp => emp.id === employeeId || emp.name === employeeId);
  if (index === -1) {
    return { success: false, error: '직원을 찾을 수 없습니다.' };
  }

  const newData = data.filter((_, i) => i !== index);

  const result = saveOrgData(newData);
  if (result.success) {
    return { success: true, data: newData };
  }
  return result;
}

/**
 * 데이터 초기화 (원본으로 복원)
 */
export function resetToOriginal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_VERSION_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 마지막 수정 시간 가져오기
 */
export function getLastModified() {
  return localStorage.getItem(STORAGE_VERSION_KEY);
}

/**
 * 커스텀 데이터가 있는지 확인
 */
export function hasCustomData() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * 고유 ID 생성
 */
function generateId() {
  return `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 고유한 실/팀 목록 추출
 */
export function extractOrganizations(data) {
  const divisions = new Set();
  const teams = new Set();

  data.forEach(emp => {
    if (emp.org_1) divisions.add(emp.org_1);
    if (emp.org_2 && emp.org_2 !== emp.org_1) teams.add(emp.org_2);
  });

  return {
    divisions: Array.from(divisions).sort(),
    teams: Array.from(teams).sort()
  };
}

/**
 * 고유한 직책 목록 추출
 */
export function extractTitles(data) {
  const titles = new Set();
  data.forEach(emp => {
    if (emp.title) titles.add(emp.title);
  });
  return Array.from(titles).sort();
}
