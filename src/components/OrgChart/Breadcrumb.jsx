/**
 * 브레드크럼 네비게이션 컴포넌트
 * 현재 위치를 계층적으로 표시
 */
export default function Breadcrumb({ path, onNavigate }) {
  if (!path || path.length === 0) return null;

  return (
    <nav className="org-breadcrumb" aria-label="조직도 네비게이션">
      <ol className="org-breadcrumb-list">
        {path.map((item, index) => (
          <li key={item.id} className="org-breadcrumb-item">
            {index > 0 && (
              <span className="org-breadcrumb-separator">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            )}

            {index < path.length - 1 ? (
              // 클릭 가능한 항목
              <button
                className="org-breadcrumb-link"
                onClick={() => onNavigate?.(item)}
              >
                {getIcon(item.type)}
                <span>{item.name}</span>
              </button>
            ) : (
              // 현재 위치 (클릭 불가)
              <span className="org-breadcrumb-current">
                {getIcon(item.type)}
                <span>{item.name}</span>
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* 뒤로가기 버튼 */}
      {path.length > 1 && (
        <button
          className="org-breadcrumb-back"
          onClick={() => onNavigate?.(path[path.length - 2])}
          aria-label="뒤로 가기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>이전</span>
        </button>
      )}
    </nav>
  );
}

/**
 * 타입별 아이콘 반환
 */
function getIcon(type) {
  const iconClass = 'org-breadcrumb-icon';

  switch (type) {
    case 'company':
      return <span className={iconClass}>🏢</span>;
    case 'division':
      return <span className={iconClass}>📊</span>;
    case 'department':
      return <span className={iconClass}>📁</span>;
    case 'team':
      return <span className={iconClass}>👥</span>;
    case 'person':
      return <span className={iconClass}>👤</span>;
    default:
      return <span className={iconClass}>📌</span>;
  }
}
