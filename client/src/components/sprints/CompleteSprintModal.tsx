import { useState } from 'react';
import { ISprint } from '@/types';
import Button from '@/components/ui/Button';

interface CompleteSprintModalProps {
  sprint: ISprint;
  planningSprints: ISprint[];
  onConfirm: (moveToSprintId?: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

type MoveOption = 'backlog' | 'sprint';

const CompleteSprintModal = ({
  sprint,
  planningSprints,
  onConfirm,
  onClose,
  isLoading,
}: CompleteSprintModalProps) => {
  const [moveOption, setMoveOption] = useState<MoveOption>('backlog');
  const [selectedSprintId, setSelectedSprintId] = useState(planningSprints[0]?._id ?? '');

  const issueCount = sprint.issueCount ?? 0;
  const completedCount = sprint.completedIssueCount ?? 0;
  const incompleteCount = issueCount - completedCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (moveOption === 'sprint' && selectedSprintId) {
      onConfirm(selectedSprintId);
    } else {
      onConfirm(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Complete sprint</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">
              {sprint.name} results
            </p>
            <div className="flex gap-4">
              <div className="flex-1 flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-xl font-bold text-green-800">{completedCount}</p>
                  <p className="text-xs text-green-700">completed</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
                <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div>
                  <p className="text-xl font-bold text-orange-800">{incompleteCount}</p>
                  <p className="text-xs text-orange-700">incomplete</p>
                </div>
              </div>
            </div>
          </div>

          {incompleteCount > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                What to do with incomplete issues?
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="move-option"
                  value="backlog"
                  checked={moveOption === 'backlog'}
                  onChange={() => setMoveOption('backlog')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Move to backlog</span>
              </label>
              {planningSprints.length > 0 && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="move-option"
                    value="sprint"
                    checked={moveOption === 'sprint'}
                    onChange={() => setMoveOption('sprint')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Move to another sprint</span>
                </label>
              )}
              {moveOption === 'sprint' && planningSprints.length > 0 && (
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="ml-6 w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {planningSprints.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Complete sprint
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteSprintModal;
