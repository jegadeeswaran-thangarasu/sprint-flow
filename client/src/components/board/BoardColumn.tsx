import { Droppable, Draggable } from '@hello-pangea/dnd';
import { IBoardColumn, IIssue, IssueStatus } from '@/types';
import BoardIssueCard from './BoardIssueCard';

interface ColumnStyle {
  dot: string;
  header: string;
  badge: string;
  droppable: string;
}

const COLUMN_STYLES: Record<string, ColumnStyle> = {
  blue: {
    dot: 'bg-blue-500',
    header: 'bg-blue-50/70',
    badge: 'bg-blue-100 text-blue-700',
    droppable: 'bg-blue-50/40',
  },
  amber: {
    dot: 'bg-amber-500',
    header: 'bg-amber-50/70',
    badge: 'bg-amber-100 text-amber-700',
    droppable: 'bg-amber-50/40',
  },
  purple: {
    dot: 'bg-purple-500',
    header: 'bg-purple-50/70',
    badge: 'bg-purple-100 text-purple-700',
    droppable: 'bg-purple-50/40',
  },
  green: {
    dot: 'bg-green-500',
    header: 'bg-green-50/70',
    badge: 'bg-green-100 text-green-700',
    droppable: 'bg-green-50/40',
  },
};

interface BoardColumnProps {
  column: IBoardColumn;
  issues: IIssue[];
  onIssueClick: (issue: IIssue) => void;
  onAddIssue: (status: IssueStatus) => void;
}

const BoardColumn = ({ column, issues, onIssueClick, onAddIssue }: BoardColumnProps) => {
  const styles = COLUMN_STYLES[column.color] ?? COLUMN_STYLES['blue'];

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 ${styles.header} border-b border-gray-200`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
          <span className="text-sm font-semibold text-gray-800">{column.label}</span>
        </div>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full tabular-nums ${styles.badge}`}>
          {issues.length}
        </span>
      </div>

      {/* Droppable body */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              'flex-1 p-2 min-h-[240px] max-h-[calc(100vh-380px)] overflow-y-auto transition-colors duration-150',
              snapshot.isDraggingOver ? styles.droppable : '',
            ].join(' ')}
          >
            {issues.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-gray-200 mx-1 mt-1">
                <p className="text-xs text-gray-400">No issues</p>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((issue, index) => (
                  <Draggable key={issue._id} draggableId={issue._id} index={index}>
                    {(draggableProvided, draggableSnapshot) => (
                      <BoardIssueCard
                        issue={issue}
                        provided={draggableProvided}
                        snapshot={draggableSnapshot}
                        onClick={() => onIssueClick(issue)}
                      />
                    )}
                  </Draggable>
                ))}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Column footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-white/80">
        <button
          type="button"
          onClick={() => onAddIssue(column.id)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors w-full"
        >
          <svg
            className="h-3.5 w-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add issue
        </button>
      </div>
    </div>
  );
};

export default BoardColumn;
