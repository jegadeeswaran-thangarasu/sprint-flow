import { useState } from 'react';
import { ISprint } from '@/types';
import Button from '@/components/ui/Button';

interface StartSprintModalProps {
  sprint: ISprint;
  issueCount: number;
  activeSprint: ISprint | null;
  onConfirm: (data: { name: string; goal: string; startDate: string; endDate: string }) => void;
  onClose: () => void;
  isLoading: boolean;
}

const toDateString = (d: Date) => d.toISOString().split('T')[0];

const StartSprintModal = ({
  sprint,
  issueCount,
  activeSprint,
  onConfirm,
  onClose,
  isLoading,
}: StartSprintModalProps) => {
  const today = toDateString(new Date());
  const twoWeeks = toDateString(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal ?? '');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(twoWeeks);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ name, goal, startDate, endDate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Start sprint</h2>
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

        {activeSprint && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{activeSprint.name}</span> is currently active. Complete it before starting a new sprint.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sprint-name">
              Sprint name
            </label>
            <input
              id="sprint-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sprint-goal">
              Sprint goal <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="sprint-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="What do you want to achieve?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="start-date">
                Start date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="end-date">
                End date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            This sprint contains <span className="font-semibold text-gray-900">{issueCount}</span>{' '}
            {issueCount === 1 ? 'issue' : 'issues'}.
          </p>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={Boolean(activeSprint) || isLoading}
            >
              Start sprint
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartSprintModal;
