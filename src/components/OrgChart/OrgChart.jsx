import React, { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from './SearchBar';
import OrgCard from './OrgCard';
import OrgConnector, { GridConnector } from './OrgConnector';
import { searchPeople, calculateOrgStats } from '../../utils/orgParser';

/**
 * 메인 조직도 컴포넌트
 * Flexbox 레이아웃 + SVG 커넥터 기반
 */
export default function OrgChart({ data, rawData }) {
  const [selectedPath, setSelectedPath] = useState(['myrealtrip']);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [stats, setStats] = useState({ totalPeople: 0, totalOrgs: 0 });

  useEffect(() => {
    if (data) {
      setStats(calculateOrgStats(data, rawData));
    }
  }, [data, rawData]);

  const handleNodeClick = useCallback((nodeId, depth) => {
    setSelectedPath(prev => {
      if (prev[depth] === nodeId) {
        return prev.slice(0, depth);
      }
      return [...prev.slice(0, depth), nodeId];
    });
    setHighlightedId(null);
  }, []);

  const handleSearch = useCallback((query) => {
    if (!data || !query || query.length < 1) {
      setSearchResults([]);
      return;
    }
    const results = searchPeople(data, query);
    setSearchResults(results.slice(0, 10));
  }, [data]);

  const handleSearchResultClick = useCallback((result) => {
    if (result.path) {
      const pathIds = result.path.map(p => p.id);
      pathIds.push(result.id);
      setSelectedPath(pathIds);
    }
    setHighlightedId(result.id);
  }, []);

  if (!data) {
    return (
      <div className="org-chart-loading">
        <div className="loading-spinner" />
        <p>조직도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="org-chart">
      <div className="org-chart-header">
        <SearchBar
          onSearch={handleSearch}
          results={searchResults}
          onResultClick={handleSearchResultClick}
        />
        <div className="org-chart-stats">
          <span>{stats.totalPeople}명</span>
          <span className="stats-divider">·</span>
          <span>{stats.totalOrgs}개 조직</span>
        </div>
      </div>

      {selectedPath.length > 1 && (
        <div className="breadcrumb">
          {selectedPath.map((nodeId, idx) => {
            const node = findNodeInTree(data, nodeId);
            if (!node) return null;
            const displayName = node.leaderName || node.name;
            return (
              <span key={nodeId} className="breadcrumb-item">
                {idx > 0 && <span className="breadcrumb-sep">›</span>}
                <button
                  onClick={() => setSelectedPath(selectedPath.slice(0, idx + 1))}
                  className={idx === selectedPath.length - 1 ? 'active' : ''}
                >
                  {displayName}
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="org-tree">
        <OrgSubtree
          node={data}
          depth={0}
          selectedPath={selectedPath}
          highlightedId={highlightedId}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}

/**
 * 재귀적 서브트리 컴포넌트
 * 각 노드 + SVG 커넥터 + 자식 행을 flexbox로 렌더링
 */
function OrgSubtree({ node, depth, selectedPath, highlightedId, onNodeClick }) {
  const parentRef = useRef(null);
  const childRefs = useRef({});
  const cLevelRefs = useRef({});
  const cLevelRowRef = useRef(null); // C-Level 행 참조 (CEO 직속 연결용)

  const isSelected = selectedPath[depth] === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = node.id === highlightedId;
  const showChildren = isSelected && hasChildren;

  // 보여줄 자식들 필터링
  const visibleChildren = showChildren
    ? node.children.filter(child => {
        const childIsSelected = selectedPath[depth + 1] === child.id;
        const hasSelectedChild = selectedPath.length > depth + 1;
        return !hasSelectedChild || childIsSelected;
      })
    : [];

  // CEO일 때 C-Level 분리
  const isCeoNode = node.id === 'ceo';
  const cLevelChildren = isCeoNode
    ? visibleChildren.filter(c => c.type === 'leader')
    : [];
  const otherChildren = isCeoNode
    ? visibleChildren.filter(c => c.type !== 'leader')
    : visibleChildren;

  // 멤버 그리드: 6명 이상 멤버만 있을 때 그리드 모드
  const allMembers = otherChildren.every(c => c.type === 'member');
  const useGrid = allMembers && otherChildren.length >= 6;

  const childCount = otherChildren.length;
  const childIds = otherChildren.map(c => c.id);
  const cLevelIds = cLevelChildren.map(c => c.id);

  return (
    <div className="org-subtree">
      {/* 1. 노드 카드 */}
      <div className="org-node-wrapper" ref={parentRef}>
        <OrgCard
          node={node}
          onClick={() => hasChildren && onNodeClick(node.id, depth)}
          isHighlighted={isHighlighted}
          hasChildren={hasChildren}
          isExpanded={isSelected}
        />
      </div>

      {/* 2. CEO인 경우: C-Level 행 먼저 */}
      {isCeoNode && cLevelChildren.length > 0 && (
        <>
          <OrgConnector
            parentRef={parentRef}
            childRefs={cLevelRefs}
            childIds={cLevelIds}
            visible={cLevelChildren.length > 0}
          />
          <div className="org-children-row org-clevel-row" ref={cLevelRowRef}>
            {cLevelChildren.map(child => (
              <div
                key={child.id}
                className="org-child-wrapper"
                ref={el => { cLevelRefs.current[child.id] = el; }}
              >
                <OrgSubtree
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  highlightedId={highlightedId}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 3. CEO인 경우: 나머지 조직들 (C-Level 아래) */}
      {isCeoNode && childCount > 0 && !useGrid && (
        <>
          <OrgConnector
            parentRef={cLevelChildren.length > 0 ? cLevelRowRef : parentRef}
            childRefs={childRefs}
            childIds={childIds}
            visible={childCount > 0}
          />
          <div className="org-children-row">
            {otherChildren.map(child => (
              <div
                key={child.id}
                className="org-child-wrapper"
                ref={el => { childRefs.current[child.id] = el; }}
              >
                <OrgSubtree
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  highlightedId={highlightedId}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 4. 일반 노드: 트리 모드 */}
      {!isCeoNode && childCount > 0 && !useGrid && (
        <>
          <OrgConnector
            parentRef={parentRef}
            childRefs={childRefs}
            childIds={childIds}
            visible={childCount > 0}
          />
          <div className="org-children-row">
            {otherChildren.map(child => (
              <div
                key={child.id}
                className="org-child-wrapper"
                ref={el => { childRefs.current[child.id] = el; }}
              >
                <OrgSubtree
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  highlightedId={highlightedId}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 5. 그리드 모드: 세로선 + 멤버 그리드 (5명 이상) */}
      {childCount > 0 && useGrid && (
        <>
          <GridConnector />
          <div className="org-grid">
            {otherChildren.map(child => (
              <OrgCard
                key={child.id}
                node={child}
                onClick={() => {}}
                isHighlighted={child.id === highlightedId}
                hasChildren={false}
                isExpanded={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function findNodeInTree(node, targetId) {
  if (node.id === targetId) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeInTree(child, targetId);
      if (found) return found;
    }
  }
  return null;
}
