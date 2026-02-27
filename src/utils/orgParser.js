/**
 * 조직도 데이터 파싱 유틸리티
 * PDF 조직도 기반 리더 중심 트리 구조
 */

// 포함할 재직 상태 (재직, 휴직만 포함 / 퇴사, 입사예정 제외)
const ALLOWED_STATUS = ['재직', '휴직'];

// 제외할 팀 목록
const EXCLUDED_TEAMS = [
  'Engagement & Retention팀',  // 삭제 요청
];

// 겸직 실장 매핑 (겸직으로 실장 역할을 하는 경우)
const DIVISION_LEADERS_OVERRIDE = {
  '마이팩실': '김진홍',  // Flight실 실장이 마이팩실 실장 겸직
};

// 직책 우선순위
const TITLE_PRIORITY = {
  'CEO': 100,
  'CFO': 99,
  'CTO': 98,
  'COO': 97,
  '경영진': 95,
  '본부장': 90,
  '실장': 80,
  '팀장': 70,
  '파트장': 60,
  '시니어 매니저': 50,
  '매니저': 40,
  '어소시에이트': 30,
  '선수': 25,
  '인턴': 10,
};

// PDF 기반 팀장 매핑 (팀명 → 팀장 이름)
const TEAM_LEADERS = {
  // CTO 산하 - Platform Solutions실
  '모바일팀': '한호',
  '회원주문개발팀': '김규원',
  '결제정산개발팀': '김진균',
  '데이터분석팀': '권희준',
  'Search & Data Infra팀': '권희준',
  '코어 플랫폼 개발팀': '김민수',
  'QA팀': '신한글',
  '프라이싱팀': '권희준',

  // CFO 산하
  'FP&A팀': '오세윤',
  'Corp Dev팀': '주진명',
  '매출관리1팀': '정지은',
  '매출관리2팀': '김경아',
  '재무회계팀': '이승길',
  'Talent Management팀': '조해인',
  'Talent Acquisition팀': '최슬기',
  '스포츠선수팀': '이한별',
  'PR팀': '정소영',
  'Workplace팀': '이한별',
  'Compliance팀': '변철주',
  '서비스정책팀': '안윤길',
  '파트너 성장지원팀': '김지선',

  // CEO 직속
  '자금팀': '차원호',

  // Flight실
  '항공개발팀': '신길호',
  '항공사업팀': '심지영',
  'B2B사업팀': '김진홍',

  // Growth실
  '세일즈 솔루션팀': '김성은',
  '제휴사업팀': '조효원',
  '광고팀': '김윤지',
  '마케팅파트너팀': '변영준',
  '그로스마케팅팀': '김하영',

  // Stay실
  '숙박프로덕트팀': '김탄',
  '국내사업팀': '김백두',
  '리셀마켓팀': '장현규',
  '해외장거리팀': '한결',
  '해외단거리팀': '조서영',

  // T&A실
  'Experience팀': '김단우',
  '동남아시아팀': '조은채',
  '중부유럽팀': '염현옥',
  '중화권팀': '윤지혜',
  '전략팀': '김연수',
  '일본팀': '최승모',
  '남부유럽팀': '이도영',
  '미주팀': '김정환',
  '대양주팀': '정유진',
  'PB사업팀': '최강규',

  // 마이팩실
  '마이팩제품팀': '허원진',
  '마이팩사업개발팀': '이준우',
  '시니어사업개발팀': '진지혜',

  // 인바운드실
  'Korea Experience팀': '한철민',
  '인바운드팀': '안대현',

  // 정보보안실
  '보안기술팀': '김형석',
  '개인정보팀': '김형석',
};

function getTitlePriority(title) {
  if (!title) return 0;
  for (const [key, value] of Object.entries(TITLE_PRIORITY)) {
    if (title.includes(key)) return value;
  }
  return 20;
}

/**
 * 사원명부 데이터를 PDF 조직도 구조로 변환
 */
export function buildOrgTree(employees) {
  if (!employees || !Array.isArray(employees)) return null;

  // 상태 기반 필터링 (재직/휴직만 포함)
  const filteredEmployees = employees.filter(emp =>
    ALLOWED_STATUS.includes(emp.status)
  );

  // 직원 맵 (이름 → 직원 정보)
  const empByName = new Map();
  filteredEmployees.forEach(emp => {
    empByName.set(emp.name, emp);
  });

  // CEO, CTO, CFO 찾기
  const ceo = filteredEmployees.find(e =>
    e.title === 'CEO' ||
    e.jobTitle === 'CEO' ||
    (e.title === '경영진' && e.name === '이동건')
  );
  const cto = filteredEmployees.find(e => e.jobTitle === 'CTO' || e.name === '허원진');
  const cfo = filteredEmployees.find(e => e.jobTitle === 'CFO' || e.name === '주진명');

  // 실/팀별 그룹화
  const orgGroups = new Map();
  filteredEmployees.forEach(emp => {
    const org1 = (emp.org_1 || '').trim();
    const org2 = (emp.org_2 || '').trim();

    if (!org1 || org1 === '경영') return;

    if (!orgGroups.has(org1)) {
      orgGroups.set(org1, { teams: new Map(), directMembers: [] });
    }

    const group = orgGroups.get(org1);
    const isDirectReport = !org2 || org2 === org1 || org2.includes('직속');

    if (isDirectReport) {
      group.directMembers.push(emp);
    } else {
      if (!group.teams.has(org2)) {
        group.teams.set(org2, []);
      }
      group.teams.get(org2).push(emp);
    }
  });

  // 루트: 마이리얼트립
  const root = {
    id: 'myrealtrip',
    name: '마이리얼트립',
    type: 'company',
    children: []
  };

  // CEO 노드
  if (ceo) {
    const ceoNode = createLeaderNode(ceo, 'CEO', 'ceo');
    ceoNode.children = [];

    // ===== 1. CTO (왼쪽 첫번째) =====
    if (cto) {
      const ctoNode = createLeaderNode(cto, 'CTO', 'cto');
      ctoNode.children = [];

      // AI Lab
      const ctoGroup = orgGroups.get('CTO 직속');
      if (ctoGroup) {
        const aiLabTeam = ctoGroup.teams.get('AI Lab');
        if (aiLabTeam && aiLabTeam.length > 0) {
          const aiLabNode = createTeamNode('AI Lab', '이동훈', aiLabTeam, empByName);
          ctoNode.children.push(aiLabNode);
        }
      }

      // Platform Solutions실
      const psGroup = orgGroups.get('Platform Solutions실');
      if (psGroup) {
        const psLeader = findLeader(psGroup.directMembers);
        if (psLeader) {
          const psNode = createDivisionNode('Platform Solutions실', psLeader, psGroup, empByName);
          ctoNode.children.push(psNode);
        }
      }

      ceoNode.children.push(ctoNode);
    }

    // ===== 2. 자금팀 (CEO 직속) =====
    const ceoGroup = orgGroups.get('CEO직속');
    if (ceoGroup) {
      const treasuryTeam = ceoGroup.teams.get('자금팀');
      if (treasuryTeam && treasuryTeam.length > 0) {
        const treasuryNode = createTeamNode('자금팀', '차원호', treasuryTeam, empByName);
        ceoNode.children.push(treasuryNode);
      }
    }

    // ===== 3. CEO 직속 실들 (가운데) =====
    const ceoDivisions = [
      'Flight실', 'Growth실', 'Stay실', 'T&A실',
      '마이팩실', '인바운드실', '정보보안실'
    ];

    ceoDivisions.forEach(divName => {
      const group = orgGroups.get(divName);
      if (group) {
        let leader = findLeader(group.directMembers);

        // 겸직 실장이 있으면 그 사람을 리더로 사용
        const overrideLeaderName = DIVISION_LEADERS_OVERRIDE[divName];
        if (!leader && overrideLeaderName && empByName.has(overrideLeaderName)) {
          leader = empByName.get(overrideLeaderName);
        }

        if (leader) {
          const divNode = createDivisionNode(divName, leader, group, empByName);
          ceoNode.children.push(divNode);
        }
      }
    });

    // ===== 4. CFO (오른쪽 마지막) =====
    if (cfo) {
      const cfoNode = createLeaderNode(cfo, 'CFO', 'cfo');
      cfoNode.children = [];

      // Corp Dev팀 (CFO 겸직)
      cfoNode.children.push({
        id: 'team_Corp_Dev팀',
        name: 'Corp Dev팀',
        leaderName: '주진명',
        type: 'team',
        children: []
      });

      // FP&A팀
      const cfoGroup = orgGroups.get('CFO 직속');
      if (cfoGroup) {
        const fpaTeam = cfoGroup.teams.get('FP&A팀');
        if (fpaTeam && fpaTeam.length > 0) {
          const fpaNode = createTeamNode('FP&A팀', '오세윤', fpaTeam, empByName);
          cfoNode.children.push(fpaNode);
        }
      }

      // 재무관리실
      const finGroup = orgGroups.get('재무관리실');
      if (finGroup) {
        const finLeader = findLeader(finGroup.directMembers);
        if (finLeader) {
          const finNode = createDivisionNode('재무관리실', finLeader, finGroup, empByName);
          cfoNode.children.push(finNode);
        }
      }

      // People & Comms실
      const pcGroup = orgGroups.get('People & Comms실');
      if (pcGroup) {
        const pcLeader = findLeader(pcGroup.directMembers);
        if (pcLeader) {
          const pcNode = createDivisionNode('People & Comms실', pcLeader, pcGroup, empByName);
          cfoNode.children.push(pcNode);
        }
      }

      // 서비스정책실
      const spGroup = orgGroups.get('서비스정책실');
      if (spGroup) {
        const spLeader = findLeader(spGroup.directMembers);
        if (spLeader) {
          const spNode = createDivisionNode('서비스정책실', spLeader, spGroup, empByName);
          cfoNode.children.push(spNode);
        }
      }

      ceoNode.children.push(cfoNode);
    }

    root.children.push(ceoNode);
  }

  return root;
}

/**
 * 리더 노드 생성
 */
function createLeaderNode(emp, title, id) {
  return {
    id: id || `leader_${emp.name}`,
    name: emp.name,
    title: title || emp.title,
    jobTitle: emp.jobTitle,
    type: 'leader',
    concurrent: emp.concurrent || '',
    children: []
  };
}

/**
 * 실(Division) 노드 생성
 */
function createDivisionNode(divName, leader, group, empByName) {
  // 겸직 실장 오버라이드 확인
  const overrideLeaderName = DIVISION_LEADERS_OVERRIDE[divName];
  let actualLeader = leader;

  if (overrideLeaderName && empByName.has(overrideLeaderName)) {
    actualLeader = empByName.get(overrideLeaderName);
  }

  const divNode = {
    id: `div_${divName.replace(/\s/g, '_')}`,
    name: divName,
    leaderName: actualLeader.name,
    leaderTitle: actualLeader.title,
    type: 'division',
    concurrent: actualLeader.concurrent || '',
    children: []
  };

  // 팀들 추가
  const sortedTeams = Array.from(group.teams.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], 'ko')
  );

  sortedTeams.forEach(([teamName, members]) => {
    // 제외할 팀 스킵
    if (EXCLUDED_TEAMS.includes(teamName)) return;

    // PDF 기반 팀장 찾기
    const pdfLeaderName = TEAM_LEADERS[teamName];
    const teamNode = createTeamNode(teamName, pdfLeaderName, members, empByName);
    divNode.children.push(teamNode);
  });

  // 직속 인원 (실장 제외)
  const directMembers = group.directMembers.filter(m =>
    m.name !== actualLeader.name && !m.title?.includes('실장')
  );

  directMembers.forEach(member => {
    divNode.children.push(createMemberNode(member));
  });

  return divNode;
}

/**
 * 팀 노드 생성 - PDF 기반 팀장 사용
 * 팀장이 없는 팀은 leaderName을 빈 문자열로 설정
 */
function createTeamNode(teamName, leaderName, members, empByName) {
  // 팀장 정보 가져오기
  let leader = null;
  let confirmedLeaderName = '';

  // PDF에 정의된 팀장 먼저 확인
  if (leaderName && empByName?.has(leaderName)) {
    leader = empByName.get(leaderName);
    confirmedLeaderName = leaderName;
  }

  // PDF에 없으면 멤버 중 "팀장" 직책을 가진 사람 찾기
  if (!leader) {
    const teamLeader = members.find(m => m.title?.includes('팀장'));
    if (teamLeader) {
      leader = teamLeader;
      confirmedLeaderName = teamLeader.name;
    }
  }

  const teamNode = {
    id: `team_${teamName.replace(/\s/g, '_')}`,
    name: teamName,
    leaderName: confirmedLeaderName,
    leaderTitle: leader?.title || '',
    type: 'team',
    concurrent: leader?.concurrent || '',
    children: []
  };

  // 팀원들 (팀장 제외)
  const teamMembers = members.filter(m => m.name !== teamNode.leaderName);
  const sortedMembers = teamMembers.sort((a, b) =>
    getTitlePriority(b.title) - getTitlePriority(a.title)
  );

  sortedMembers.forEach(member => {
    teamNode.children.push(createMemberNode(member));
  });

  return teamNode;
}

/**
 * 일반 멤버 노드 생성
 */
function createMemberNode(emp) {
  return {
    id: `member_${emp.id || emp.name}`,
    name: emp.name,
    title: emp.title || '',
    jobTitle: emp.jobTitle || '',
    type: 'member',
    status: emp.status || '재직',
    concurrent: emp.concurrent || '',
    children: []
  };
}

/**
 * 그룹에서 리더 찾기
 */
function findLeader(members) {
  if (!members || members.length === 0) return null;

  let leader = members.find(m => m.title?.includes('실장'));
  if (leader) return leader;

  leader = members.find(m => m.title?.includes('본부장'));
  if (leader) return leader;

  leader = members.find(m => m.title?.includes('팀장'));
  if (leader) return leader;

  return members.reduce((prev, curr) =>
    getTitlePriority(curr.title) > getTitlePriority(prev.title) ? curr : prev
  , members[0]);
}

/**
 * 검색 기능 - 이름으로만 검색
 */
export function searchPeople(node, query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  function traverse(n, path = []) {
    const currentPath = [...path, { id: n.id, name: n.name, type: n.type }];

    // 리더, 멤버 검색 (이름으로만)
    if (n.type === 'leader' || n.type === 'member') {
      if (n.name && n.name.toLowerCase().includes(lowerQuery)) {
        results.push({ ...n, path: path });
      }
    }

    // 실/팀의 리더 이름으로 검색
    if ((n.type === 'division' || n.type === 'team') && n.leaderName) {
      if (n.leaderName.toLowerCase().includes(lowerQuery)) {
        results.push({
          ...n,
          name: n.leaderName,
          title: n.leaderTitle,
          orgName: n.name,
          path: path
        });
      }
    }

    if (n.children) {
      n.children.forEach(child => traverse(child, currentPath));
    }
  }

  traverse(node);
  return results.sort((a, b) => getTitlePriority(b.title) - getTitlePriority(a.title));
}

/**
 * ID로 노드 찾기
 */
export function findNodeById(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 경로 찾기
 */
export function findPathToNode(root, targetId, path = []) {
  if (root.id === targetId) {
    return [...path, { id: root.id, name: root.name, type: root.type }];
  }
  if (root.children) {
    for (const child of root.children) {
      const result = findPathToNode(
        child, targetId,
        [...path, { id: root.id, name: root.name, type: root.type }]
      );
      if (result) return result;
    }
  }
  return null;
}

/**
 * 통계 계산 - 원본 데이터 기준
 */
export function calculateOrgStats(node, rawData) {
  // 원본 데이터가 있으면 그걸로 계산
  if (rawData && Array.isArray(rawData)) {
    const filtered = rawData.filter(e => ALLOWED_STATUS.includes(e.status));
    const orgs = new Set();
    filtered.forEach(e => {
      if (e.org_1) orgs.add(e.org_1);
      if (e.org_2 && e.org_2 !== e.org_1) orgs.add(e.org_2);
    });
    return {
      totalPeople: filtered.length,
      totalOrgs: orgs.size
    };
  }

  // 폴백: 트리 구조에서 계산
  let totalPeople = 0;
  let totalOrgs = 0;

  function traverse(n) {
    if (n.type === 'member' || n.type === 'leader') {
      totalPeople++;
    }
    if (n.type === 'division' || n.type === 'team') {
      totalOrgs++;
      totalPeople++;
    }
    if (n.children) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return { totalPeople, totalOrgs };
}
