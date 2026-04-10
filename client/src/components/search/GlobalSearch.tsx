import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useDashboard';
import { IProject, ISearchIssue, IUser } from '@/types';

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type TFlatRow =
  | { key: string; kind: 'issue'; issue: ISearchIssue }
  | { key: string; kind: 'project'; project: IProject }
  | { key: string; kind: 'member'; member: IUser };

interface GlobalSearchProps {
  orgSlug: string;
}

const sectionTitle = (kind: TFlatRow['kind']): string => {
  if (kind === 'issue') return 'Issues';
  if (kind === 'project') return 'Projects';
  return 'Members';
};

const GlobalSearch = ({ orgSlug }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const { data, isFetching, isLoading } = useSearch(orgSlug, debounced);

  const isDebouncing = query.length >= 2 && debounced !== query;
  const showSpinner =
    query.trim().length >= 2 && (isDebouncing || isLoading || (isFetching && !isDebouncing));

  const flatRows = useMemo((): TFlatRow[] => {
    if (!data || debounced.trim().length < 2) return [];
    const rows: TFlatRow[] = [];
    for (const issue of data.issues) {
      rows.push({ key: `issue-${issue._id}`, kind: 'issue', issue });
    }
    for (const project of data.projects) {
      rows.push({ key: `project-${project._id}`, kind: 'project', project });
    }
    for (const member of data.members) {
      rows.push({ key: `member-${member._id}`, kind: 'member', member });
    }
    return rows;
  }, [data, debounced]);

  useEffect(() => {
    setFocusIndex(0);
  }, [flatRows.length, debounced, open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === 'k' || e.key === 'K';
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setFocusIndex(0);
  }, []);

  const go = useCallback(
    (row: TFlatRow) => {
      if (row.kind === 'issue') {
        navigate(`/org/${orgSlug}/projects/${row.issue.project._id}/issues/${row.issue._id}`);
      } else if (row.kind === 'project') {
        navigate(`/org/${orgSlug}/projects/${row.project._id}/board`);
      } else {
        navigate(`/org/${orgSlug}/members`);
      }
      close();
    },
    [close, navigate, orgSlug],
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (flatRows.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, flatRows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = flatRows[focusIndex];
      if (row) go(row);
    }
  };

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-search-index="${focusIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex, open, flatRows]);

  const modal = open ? (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[min(70vh,520px)]"
        role="dialog"
        aria-modal
        aria-label="Search"
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
          <svg
            className="h-5 w-5 text-gray-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search issues, projects, members..."
            className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
            autoComplete="off"
            spellCheck={false}
          />
          {showSpinner && (
            <svg
              className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          <kbd className="hidden sm:inline text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-[200px]">
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">Type at least 2 characters to search</p>
          )}

          {debounced.trim().length >= 2 && !showSpinner && data && flatRows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              No results for &apos;{debounced.trim()}&apos;
            </p>
          )}

          {debounced.trim().length >= 2 && data && flatRows.length > 0 && (
            <div className="py-2">
              {flatRows.map((row, idx) => {
                const showHeader = idx === 0 || flatRows[idx - 1].kind !== row.kind;
                const active = idx === focusIndex;

                if (row.kind === 'issue') {
                  const { issue } = row;
                  return (
                    <div key={row.key}>
                      {showHeader && (
                        <p className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          {sectionTitle('issue')}
                        </p>
                      )}
                      <button
                        type="button"
                        data-search-index={idx}
                        onClick={() => go(row)}
                        className={[
                          'w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors',
                          active ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800',
                        ].join(' ')}
                      >
                        <span className="min-w-0">
                          <span className="font-mono text-xs text-gray-500">{issue.key}</span>{' '}
                          <span className="truncate">{issue.title}</span>
                        </span>
                        <span
                          className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 max-w-[120px] truncate"
                          title={issue.project.name}
                        >
                          {issue.project.key}
                        </span>
                      </button>
                    </div>
                  );
                }

                if (row.kind === 'project') {
                  const { project } = row;
                  const accent = project.color || '#6366f1';
                  return (
                    <div key={row.key}>
                      {showHeader && (
                        <p className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          {sectionTitle('project')}
                        </p>
                      )}
                      <button
                        type="button"
                        data-search-index={idx}
                        onClick={() => go(row)}
                        className={[
                          'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                          active ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800',
                        ].join(' ')}
                      >
                        <span
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                          style={{ backgroundColor: `${accent}22` }}
                        >
                          {project.icon || '📁'}
                        </span>
                        <span className="flex-1 min-w-0 truncate font-medium">{project.name}</span>
                        <span className="text-xs font-mono text-gray-500 flex-shrink-0">{project.key}</span>
                      </button>
                    </div>
                  );
                }

                const { member } = row;
                const initial = member.name?.[0]?.toUpperCase() ?? '?';
                return (
                  <div key={row.key}>
                    {showHeader && (
                      <p className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        {sectionTitle('member')}
                      </p>
                    )}
                    <button
                      type="button"
                      data-search-index={idx}
                      onClick={() => go(row)}
                      className={[
                        'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                        active ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800',
                      ].join(' ')}
                    >
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-blue-700">{initial}</span>
                        </div>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{member.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{member.email}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
          <span>
            <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> navigate ·{' '}
            <kbd className="font-sans">Enter</kbd> open
          </span>
          <span className="hidden sm:inline">
            <kbd className="font-sans">⌘</kbd>
            <kbd className="font-sans">K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        id="global-search-trigger"
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/80 text-left text-sm text-gray-500 hover:border-gray-300 hover:bg-white transition-colors"
        aria-label="Open search"
      >
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 truncate">Search…</span>
        <kbd className="hidden sm:inline text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>
      {typeof document !== 'undefined' && createPortal(modal, document.body)}
    </>
  );
};

export default GlobalSearch;
