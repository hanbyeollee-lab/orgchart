const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Excel 파일 읽기 (최신 파일: 0303)
const workbook = XLSX.readFile('/Users/hanbyeol-lee/Downloads/2026사원명부_0303.xlsx');
const sheet = workbook.Sheets['26년 사원명부'];
const rawData = XLSX.utils.sheet_to_json(sheet);

// 데이터 파싱 (재직/휴직만)
const employees = [];
for (const row of rawData) {
  const status = row['재직상태'];

  // 재직/휴직만 포함
  if (status !== '재직' && status !== '휴직') continue;

  const employee = {
    id: String(row['사번'] || `emp_${employees.length}`),
    name: row['이름'] || '',
    org_1: (row['org_1(실)'] || '').trim(),  // 실
    org_2: (row['org_2(팀)'] || '').trim(),  // 팀
    jobTitle: row['직무명'] || '',
    title: row['직책'] || '',
    concurrent: row['겸직여부'] || '',  // 겸직 정보
    manager1: row['1차 조직장'] || '',
    manager2: row['2차 조직장'] || '',
    status: status,
  };

  // 이름이 있는 경우만 추가
  if (employee.name) {
    employees.push(employee);
  }
}

console.log(`총 직원 수 (재직/휴직): ${employees.length}명`);

// 조직 구조 분석
const orgStructure = {};
employees.forEach(emp => {
  const key = `${emp.org_1} > ${emp.org_2}`;
  if (!orgStructure[key]) {
    orgStructure[key] = [];
  }
  orgStructure[key].push(emp.name);
});

console.log('\n=== 조직 구조 ===');
Object.keys(orgStructure).sort().forEach(key => {
  console.log(`${key}: ${orgStructure[key].length}명`);
});

// 겸직자 분석
const concurrentPeople = employees.filter(e => e.concurrent && e.concurrent !== '-');
console.log(`\n=== 겸직자 (${concurrentPeople.length}명) ===`);
concurrentPeople.forEach(e => {
  console.log(`- ${e.name}: ${e.title}/${e.jobTitle} + 겸직: ${e.concurrent}`);
});

// JSON 저장
const outputPath = path.join(__dirname, '../src/data/orgData.json');
fs.writeFileSync(outputPath, JSON.stringify(employees, null, 2), 'utf-8');
console.log(`\n데이터 저장 완료: ${outputPath}`);
