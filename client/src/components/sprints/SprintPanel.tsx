import { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ISprint, IIssue } from '@/types';
import { useSprintIssues } from '@/hooks/useSprint';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';
import Button from '@/components/ui/Button';
import StartSprintModal from './StartSprintModal';
import CompleteSprintModal from './CompleteSprintModal';

interface SprintPanelProps {
  sprint: ISprint;
  allSprints: ISprint[];
  activeSprint: ISprint | null;
  orgSlug: string;
  projectId: string;
  onStartSprint: (sprintId: string, data: { name: string; goal: string; startDate: string; endDate: string }) => void;
  onCompleteSprint: (sprintId: string, moveToSprintId?: string) => void;
  onDeleteSprint: (sprintId: string) => void;
  onEditSprint: (sprint: ISprint) => void;
  onIssueClick: (issue: IIssue) => void;
  onRemoveFromSprint: (issueId: string) => void;
  onMoveToSprint: (issueId: string, sprintId: string) => void;
  isStarting: boolean;
  isCompleting: boolean;
}

const Avatar = ({ name, avatar }: { name: string; avatar: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover border border-gray-200" />;
  }
  return (
    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
      {initial}
    </div>
  );
};

const formatDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_BADGE: Record<ISprint['status'], { label: string; className: string }> = {
  planning: { label: 'Planning', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Active', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

const SprintPanel = ({
  sprint,
  allSprints,
  activeSprint,
  orgSlug,
  projectId,
  onStartSprint,
  onCompleteSprint,
  onDeleteSprint,
  onEditSprint,
  onIssueClick,
  onRemoveFromSprint,
  onMoveToSprint,
  isStarting,
  isCompleting,
}: SprintPanelProps) => {
  const { data: issues = [] } = useSprintIssues(orgSlug, projectId, sprint._id);
  const [expanded, setExpanded] = useState(sprint.status !== 'completed');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [issueMenuId, setIssueMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!issueMenuId) return;
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('[data-sprint-issue-menu]')) setIssueMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [issueMenuId]);

  const badge = STATUS_BADGE[sprint.status];
  const planningSprints = allSprints.filter((s) => s.status === 'planning' && s._id !== sprint._id);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer select-none"
      >
        {/* Chevron */}
        <svg
          className={['h-4 w-4 text-gray-400 flex-shrink-0 transition-transform', expanded ? 'rotate-90' : ''].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        <span className="font-semibold text-sm text-gray-900 flex-shrink-0">{sprint.name}</span>

        <span className={['text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0', badge.className].join(' ')}>
          {badge.label}
        </span>

        <span className="text-xs text-gray-400 flex-shrink-0">
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </span>

        <div className="flex-1" />

        {/* Right side actions */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {sprint.status === 'planning' && (
            <>
              <Button
                size="sm"
                onClick={() => setShowStartModal(true)}
              >
                Start sprint
              </Button>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => { setMenuOpen(false); onEditSprint(sprint); }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                      onClick={() => { setMenuOpen(false); onDeleteSprint(sprint._id); }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {sprint.status === 'active' && (
            <>
              <span className="text-xs text-gray-500 hidden sm:block">
                {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCompleteModal(true)}
              >
                Complete sprint
              </Button>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => { setMenuOpen(false); onEditSprint(sprint); }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {sprint.status === 'completed' && (
            <span className="text-xs text-gray-500">
              Completed {formatDate(sprint.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Issues list */}
      {expanded && (
        <Droppable droppableId={sprint._id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={[
                'border-t border-gray-100 divide-y divide-gray-100 min-h-[2px]',
                snapshot.isDraggingOver ? 'bg-blue-50' : '',
              ].join(' ')}
            >
              {issues.map((issue, index) => (
                <Draggable
                  key={issue._id}
                  draggableId={issue._id}
                  index={index}
                  isDragDisabled={sprint.status === 'completed'}
                >
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors',
                        dragSnapshot.isDragging ? 'bg-white shadow-md rounded-lg' : '',
                      ].join(' ')}
                    >
                      <span
                        {...dragProvided.dragHandleProps}
                        className="text-gray-300 select-none w-4 text-center cursor-grab flex-shrink-0"
                        aria-label="Drag"
                      >
                        ⠿
                      </span>
                      <IssueTypeIcon type={issue.type} size="sm" />
                      <span className="text-xs font-mono text-gray-400 w-14 flex-shrink-0 truncate">
                        {issue.key}
                      </span>
                      <button
                        type="button"
                        className="flex-1 text-left text-sm font-medium text-gray-900 truncate min-w-0 hover:text-blue-600"
                        onClick={() => onIssueClick(issue)}
                      >
                        {issue.title}
                      </button>
                      <span className="flex-shrink-0 w-12 flex justify-center">
                        <PriorityIcon priority={issue.priority} />
                      </span>
                      <span className="flex-shrink-0 w-7">
                        {issue.assignee ? (
                          <Avatar name={issue.assignee.name} avatar={issue.assignee.avatar} />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-200" />
                        )}
                      </span>
                      <span className="flex-shrink-0 w-8 text-center">
                        {issue.storyPoints != null ? (
                          <span className="text-xs font-semibold text-gray-600 tabular-nums">
                            {issue.storyPoints}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </span>

                      {/* Issue menu */}
                      <div
                        className="relative flex-shrink-0"
                        data-sprint-issue-menu
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => setIssueMenuId((v) => (v === issue._id ? null : issue._id))}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                        {issueMenuId === issue._id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm">
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-50"
                              onClick={() => { setIssueMenuId(null); onIssueClick(issue); }}
                            >
                              View / Edit
                            </button>
                            {sprint.status !== 'completed' && (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                                onClick={() => { setIssueMenuId(null); onRemoveFromSprint(issue._id); }}
                              >
                                Move to backlog
                              </button>
                            )}
                            {planningSprints.length > 0 && sprint.status !== 'completed' && planningSprints.map((s) => (
                              <button
                                key={s._id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 truncate"
                                onClick={() => { setIssueMenuId(null); onMoveToSprint(issue._id, s._id); }}
                              >
                                Move to {s.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {issues.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  No issues in this sprint. Drag issues here or use the backlog menu.
                </div>
              )}
            </div>
          )}
        </Droppable>
      )}

      {showStartModal && (
        <StartSprintModal
          sprint={sprint}
          issueCount={issues.length}
          activeSprint={activeSprint?._id !== sprint._id ? activeSprint : null}
          onConfirm={(data) => {
            onStartSprint(sprint._id, data);
            setShowStartModal(false);
          }}
          onClose={() => setShowStartModal(false)}
          isLoading={isStarting}
        />
      )}

      {showCompleteModal && (
        <CompleteSprintModal
          sprint={sprint}
          planningSprints={planningSprints}
          onConfirm={(moveToSprintId) => {
            onCompleteSprint(sprint._id, moveToSprintId);
            setShowCompleteModal(false);
          }}
          onClose={() => setShowCompleteModal(false)}
          isLoading={isCompleting}
        />
      )}
    </div>
  );
};

export default SprintPanel;
