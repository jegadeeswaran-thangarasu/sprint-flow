import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { useCreateIssue } from '@/hooks/useIssue';
import { IProject, IssuePriority, IssueStatus, IssueType } from '@/types';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';

const TYPES: IssueType[] = ['story', 'task', 'bug', 'epic', 'subtask'];

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'inprogress', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'done', label: 'Done' },
];

const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low'];

const LABEL_SUGGESTIONS = ['bug', 'feature', 'improvement', 'documentation', 'design'] as const;

const schema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(500),
  description: z.string().optional(),
  type: z.enum(['story', 'task', 'bug', 'epic', 'subtask']),
  status: z.enum(['backlog', 'todo', 'inprogress', 'review', 'done']),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  assigneeId: z.string().optional(),
  storyPoints: z.number().int().min(0).max(99).optional(),
  dueDate: z.string().optional(),
});

type TFormValues = z.infer<typeof schema>;

interface CreateIssueModalProps {
  onClose: () => void;
  orgSlug: string;
  projectId: string;
  project: IProject;
  defaultStatus?: IssueStatus;
}

const CreateIssueModal = ({
  onClose,
  orgSlug,
  projectId,
  project,
  defaultStatus = 'backlog',
}: CreateIssueModalProps) => {
  const createIssue = useCreateIssue(orgSlug, projectId);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelDraft, setLabelDraft] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const defaultValues = useMemo(
    () => ({
      title: '',
      description: '',
      type: 'task' as IssueType,
      status: defaultStatus,
      priority: 'medium' as IssuePriority,
      assigneeId: '',
      storyPoints: undefined as number | undefined,
      dueDate: '',
    }),
    [defaultStatus],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedAssigneeId = watch('assigneeId');

  const members = useMemo(() => {
    const list = [...project.members.map((m) => m.user)];
    const lead = project.lead;
    if (lead && !list.some((u) => u._id === lead._id)) {
      list.unshift(lead);
    }
    return list;
  }, [project]);

  const filteredMembers = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [assigneeSearch, members]);

  const selectedMember = useMemo(() => {
    if (!selectedAssigneeId) return null;
    return members.find((m) => m._id === selectedAssigneeId) ?? null;
  }, [selectedAssigneeId, members]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const addLabel = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t || labels.includes(t)) return;
    setLabels((prev) => [...prev, t]);
    setLabelDraft('');
  };

  const removeLabel = (label: string) => {
    setLabels((prev) => prev.filter((l) => l !== label));
  };

  const onSubmit = (values: TFormValues) => {
    createIssue.mutate(
      {
        title: values.title,
        description: values.description?.trim() || undefined,
        type: values.type,
        status: values.status,
        priority: values.priority,
        assignee: values.assigneeId?.trim() ? values.assigneeId.trim() : null,
        storyPoints: values.storyPoints ?? null,
        labels: labels.length > 0 ? labels : undefined,
        dueDate: values.dueDate?.trim()
          ? new Date(values.dueDate.trim()).toISOString()
          : null,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Create issue</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={[
                          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors capitalize',
                          field.value === t
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <IssueTypeIcon type={t} size="sm" />
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                type="text"
                autoFocus
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Add context…"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 text-sm">
                        <PriorityIcon priority={field.value} showLabel />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
              <button
                type="button"
                onClick={() => setAssigneeOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md text-left hover:bg-gray-50"
              >
                {selectedMember ? (
                  <>
                    {selectedMember.avatar ? (
                      <img
                        src={selectedMember.avatar}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                        {selectedMember.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{selectedMember.name}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </button>
              {assigneeOpen && (
                <div className="absolute left-0 right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-56 overflow-y-auto">
                  <input
                    type="search"
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder="Search members…"
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md mb-2"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 rounded"
                    onClick={() => {
                      setValue('assigneeId', '');
                      setAssigneeOpen(false);
                    }}
                  >
                    Unassigned
                  </button>
                  {filteredMembers.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50"
                      onClick={() => {
                        setValue('assigneeId', m._id);
                        setAssigneeOpen(false);
                        setAssigneeSearch('');
                      }}
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold">
                          {m.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Story points</label>
              <input
                {...register('storyPoints', {
                  setValueAs: (v: unknown) => {
                    if (v === '' || v === undefined || v === null) return undefined;
                    const n = parseInt(String(v), 10);
                    return Number.isFinite(n) ? n : undefined;
                  },
                })}
                type="number"
                min={0}
                max={99}
                placeholder="0–99"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.storyPoints && (
                <p className="mt-1 text-xs text-red-500">{errors.storyPoints.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Labels</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {labels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => removeLabel(l)}
                      className="p-0.5 rounded-full hover:bg-gray-200 text-gray-500"
                      aria-label={`Remove ${l}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLabel(labelDraft);
                    }
                  }}
                  placeholder="Add label, press Enter"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">Suggestions:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {LABEL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addLabel(s)}
                    className="text-xs px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due date</label>
              <input
                {...register('dueDate')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={createIssue.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createIssue.isPending}>
              Create issue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
