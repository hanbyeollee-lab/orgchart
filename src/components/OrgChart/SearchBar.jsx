import { useState, useEffect, useRef } from 'react';

/**
 * 검색 바 컴포넌트
 * 이름으로 사람 검색
 */
export default function SearchBar({
  onSearch,
  results = [],
  onResultClick,
  placeholder = '이름으로 검색...'
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // 검색 실행 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(query);
      if (query.length > 0) {
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setIsOpen(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 결과 선택
  const handleSelect = (result) => {
    onResultClick?.(result);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // 검색 초기화
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="org-search">
      <div className="org-search-input-wrapper">
        {/* 검색 아이콘 */}
        <svg
          className="org-search-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        {/* 검색 입력 */}
        <input
          ref={inputRef}
          type="text"
          className="org-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          aria-label="조직도 검색"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />

        {/* 초기화 버튼 */}
        {query.length > 0 && (
          <button
            className="org-search-clear"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div
          ref={resultsRef}
          id="search-results"
          className="org-search-results"
          role="listbox"
        >
          {results.length > 0 ? (
            <>
              <div className="org-search-results-header">
                검색 결과 ({results.length}명)
              </div>
              <ul className="org-search-results-list">
                {results.map((result, index) => (
                  <li
                    key={result.id}
                    className={`org-search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelect(result)}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <div className="org-search-result-avatar">
                      {result.name.charAt(0)}
                    </div>
                    <div className="org-search-result-info">
                      <div className="org-search-result-name">
                        {highlightMatch(result.name, query)}
                      </div>
                      <div className="org-search-result-detail">
                        {result.title && <span>{highlightMatch(result.title, query)}</span>}
                        {result.title && result.jobTitle && ' · '}
                        {result.jobTitle && <span>{highlightMatch(result.jobTitle, query)}</span>}
                      </div>
                      {result.path && result.path.length > 0 && (
                        <div className="org-search-result-path">
                          {result.path.map(p => p.name).join(' > ')}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : query.length > 0 ? (
            <div className="org-search-no-results">
              <span>'{query}' 검색 결과가 없습니다</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * 검색어 하이라이트
 */
function highlightMatch(text, query) {
  if (!query || !text) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="org-search-highlight">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}
