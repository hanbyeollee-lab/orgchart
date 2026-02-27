import { useLayoutEffect, useRef, useState, useCallback } from 'react';

/**
 * SVG 커넥터 컴포넌트
 * 부모 노드와 자식 노드들 사이의 연결선을 SVG path로 렌더링
 *
 * 구조:
 *   [부모]
 *      │        ← 세로선 (부모 하단 중앙 → 수평선)
 *   ───┼───     ← 가로선 (첫 자식 중앙 ~ 마지막 자식 중앙)
 *   │     │     ← 세로선 (수평선 → 각 자식 상단 중앙)
 *  [자식] [자식]
 */
export default function OrgConnector({
  parentRef,
  childRefs,
  childIds,
  visible = true,
  lineColor = '#333333',
  lineWidth = 1.5,
}) {
  const svgRef = useRef(null);
  const [paths, setPaths] = useState([]);

  const calculatePaths = useCallback(() => {
    if (!visible || !parentRef?.current || !svgRef.current) {
      setPaths([]);
      return;
    }

    const svgRect = svgRef.current.getBoundingClientRect();
    const parentRect = parentRef.current.getBoundingClientRect();

    // 부모 하단 중앙 (SVG 기준 상대좌표)
    const parentCenterX = parentRect.left + parentRect.width / 2 - svgRect.left;

    // 각 자식의 상단 중앙 좌표 수집
    const childPositions = [];
    for (const id of childIds) {
      const el = childRefs.current?.[id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      childPositions.push({
        id,
        cx: rect.left + rect.width / 2 - svgRect.left,
      });
    }

    if (childPositions.length === 0) {
      setPaths([]);
      return;
    }

    const svgHeight = svgRect.height;
    const midY = svgHeight / 2;
    const newPaths = [];

    if (childPositions.length === 1) {
      // 자식이 1개면 자식 중앙 기준 일직선
      const childX = childPositions[0].cx;
      newPaths.push({
        d: `M ${childX} 0 V ${svgHeight}`,
        key: 'single-line',
      });
    } else {
      // 가로선 범위 계산
      const leftX = Math.min(...childPositions.map(c => c.cx));
      const rightX = Math.max(...childPositions.map(c => c.cx));
      const horizontalCenterX = (leftX + rightX) / 2;

      // 1. 가로선 중앙에서 위로 세로선 (일직선)
      newPaths.push({
        d: `M ${horizontalCenterX} 0 V ${midY}`,
        key: 'parent-down',
      });

      // 2. 가로선 (첫 자식 ~ 마지막 자식)
      newPaths.push({
        d: `M ${leftX} ${midY} H ${rightX}`,
        key: 'horizontal',
      });

      // 3. 각 자식으로 내려가는 세로선
      childPositions.forEach((pos, i) => {
        newPaths.push({
          d: `M ${pos.cx} ${midY} V ${svgHeight}`,
          key: `child-up-${i}`,
        });
      });
    }

    setPaths(newPaths);
  }, [visible, parentRef, childRefs, childIds]);

  // DOM 렌더 후 위치 계산
  useLayoutEffect(() => {
    calculatePaths();
  }, [calculatePaths]);

  // 레이아웃 변경 감지 (ResizeObserver)
  useLayoutEffect(() => {
    if (!svgRef.current) return;

    const observer = new ResizeObserver(() => {
      calculatePaths();
    });

    // SVG 부모 요소 관찰 (subtree 컨테이너)
    const subtreeEl = svgRef.current.parentElement;
    if (subtreeEl) {
      observer.observe(subtreeEl);
    }

    return () => observer.disconnect();
  }, [calculatePaths]);

  if (!visible) return null;

  return (
    <svg
      ref={svgRef}
      className="org-connector-svg"
      aria-hidden="true"
    >
      {paths.map(({ d, key }) => (
        <path
          key={key}
          d={d}
          stroke={lineColor}
          strokeWidth={lineWidth}
          strokeLinecap="square"
          fill="none"
        />
      ))}
    </svg>
  );
}

/**
 * 그리드 모드용 단순 세로선 커넥터
 * 부모 → 그리드 컨테이너 연결
 */
export function GridConnector({ lineColor = '#333333', lineWidth = 1.5 }) {
  return (
    <svg className="org-connector-svg org-connector-grid" aria-hidden="true">
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="100%"
        stroke={lineColor}
        strokeWidth={lineWidth}
        strokeLinecap="square"
      />
    </svg>
  );
}
