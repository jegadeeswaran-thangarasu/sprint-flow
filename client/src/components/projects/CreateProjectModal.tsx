import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';

const PRESET_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
] as const;

const PRESET_ICONS = ['🚀', '💻', '🎯', '🐛', '⚡', '📱', '🔧', '🎨'] as const;

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]+$/, 'Key must contain uppercase letters only')
    .min(2, 'Key must be at least 2 characters')
    .max(6, 'Key must be at most 6 characters'),
  description: z.string().trim().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type TFormValues = z.infer<typeof schema>;

function deriveKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 6)
    .toUpperCase();
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (data: TFormValues) => void;
  isLoading: boolean;
}

const CreateProjectModal = ({ onClose, onSubmit, isLoading }: CreateProjectModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      icon: '🚀',
      color: '#6366f1',
    },
  });

  const watchedName = useWatch({ control, name: 'name' });
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const currentKey = watch('key');

  // Auto-generate key from name
  useEffect(() => {
    const derived = deriveKey(watchedName ?? '');
    if (derived) {
      setValue('key', derived, { shouldValidate: false });
    }
  }, [watchedName, setValue]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Create project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="e.g. Frontend Redesign"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project key <span className="text-red-500">*</span>
              </label>
              <input
                {...register('key')}
                type="text"
                maxLength={6}
                placeholder="e.g. FE"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 uppercase"
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                  setValue('key', upper, { shouldValidate: true });
                }}
              />
              {errors.key ? (
                <p className="mt-1 text-xs text-red-500">{errors.key.message}</p>
              ) : currentKey ? (
                <p className="mt-1 text-xs text-gray-400">
                  Issues will look like{' '}
                  <span className="font-mono font-medium text-gray-600">
                    {currentKey}-1, {currentKey}-2
                  </span>
                </p>
              ) : null}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="What is this project about?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue('icon', emoji)}
                    className={[
                      'h-9 w-9 text-lg rounded-md border-2 transition-all flex items-center justify-center',
                      selectedIcon === emoji
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className="h-8 w-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ring-offset-2"
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  >
                    {selectedColor === color && (
                      <svg
                        className="h-4 w-4 text-white drop-shadow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
