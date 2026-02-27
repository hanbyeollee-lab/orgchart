import { useState } from 'react';

/**
 * 조직도 카드 컴포넌트
 * PDF 조직도 스타일 - 조직명/리더명 표시
 * 휴직자는 시각적으로 구분 (opacity + 뱃지)
 */
export default function OrgCard({
  node,
  onClick,
  isHighlighted = false,
  isExpanded = false,
  hasChildren = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isOnLeave = node.status === '휴직';

  // 노드 타입별 표시 정보
  const getDisplayInfo = () => {
    switch (node.type) {
      case 'company':
        return {
          title: '',
          name: node.name,
          subtitle: '',
          cardClass: 'org-card-company'
        };

      case 'leader':
        return {
          title: node.title,  // CEO, CTO, CFO
          name: node.name,
          subtitle: node.concurrent || '',
          cardClass: 'org-card-clevel'
        };

      case 'division':
        return {
          title: node.name,  // 실 이름
          name: node.leaderName,  // 실장 이름
          subtitle: node.concurrent || '',
          cardClass: 'org-card-division'
        };

      case 'team':
        return {
          title: node.name,  // 팀 이름
          name: node.leaderName,  // 팀장 이름
          subtitle: node.concurrent || '',
          cardClass: 'org-card-team'
        };

      case 'member':
        return {
          title: node.jobTitle || node.title,  // 직무명
          name: node.name,
          subtitle: '',
          cardClass: 'org-card-member'
        };

      default:
        return {
          title: '',
          name: node.name,
          subtitle: '',
          cardClass: ''
        };
    }
  };

  const { title, name, subtitle, cardClass } = getDisplayInfo();

  return (
    <div
      className={`org-card ${cardClass} ${isHighlighted ? 'highlighted' : ''} ${isExpanded ? 'expanded' : ''} ${isHovered ? 'hovered' : ''} ${isOnLeave ? 'org-card-onleave' : ''}`}
      onClick={() => onClick?.(node)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(node);
        }
      }}
    >
      <div className="org-card-content">
        {/* 회사 로고 (company 타입) */}
        {node.type === 'company' ? (
          <img src="/logo-white.png" alt={name} className="org-card-logo" />
        ) : (
          <>
            {/* 조직명/직책 */}
            {title && (
              <div className="org-card-title">{title}</div>
            )}

            {/* 이름 (리더/담당자) */}
            <div className="org-card-name">{name}</div>

            {/* 휴직 뱃지 */}
            {isOnLeave && (
              <div className="org-card-leave-badge">휴직</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
