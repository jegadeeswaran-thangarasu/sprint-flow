import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateOrganisation } from '@/hooks/useOrganisation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, 'Organisation name must be at least 2 characters')
    .max(60, 'Organisation name must be at most 60 characters'),
  description: z.string().max(200, 'Description must be at most 200 characters').optional(),
});

type TCreateOrgForm = z.infer<typeof createOrgSchema>;

const generateSlugPreview = (name: string): string => {
  if (!name.trim()) return '';
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : '';
};

const OnboardingPage = () => {
  const [step, setStep] = useState<'welcome' | 'create'>('welcome');
  const [slugPreview, setSlugPreview] = useState('');
  const { mutate: createOrg, isPending, error } = useCreateOrganisation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TCreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
  });

  const nameValue = watch('name', '');

  const handleNameChange = (value: string) => {
    setSlugPreview(generateSlugPreview(value));
  };

  const onSubmit = (values: TCreateOrgForm) => {
    createOrg({ name: values.name, description: values.description });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {step === 'welcome' ? (
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <svg
                    className="h-7 w-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-gray-900">SprintFlow</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to SprintFlow</h1>
            <p className="text-gray-500 mb-10 text-base">
              Let&apos;s set up your workspace. It only takes a moment.
            </p>

            <Button size="lg" className="w-full" onClick={() => setStep('create')}>
              Create your organisation
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-6">
              <button
                onClick={() => setStep('welcome')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h2 className="text-xl font-bold text-gray-900">Create your workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your workspace is where your team manages projects and sprints.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div>
                <Input
                  id="name"
                  label="Organisation name"
                  placeholder="Acme Corp"
                  error={errors.name?.message}
                  {...register('name', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      handleNameChange(e.target.value),
                  })}
                />
                {nameValue.trim() && slugPreview && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Your URL will be:{' '}
                    <span className="font-medium text-gray-600">
                      sprintflow.app/org/{slugPreview}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="What does your team work on?"
                  className={[
                    'w-full rounded-md border px-3 py-2 text-sm text-gray-900 resize-none',
                    'placeholder:text-gray-400 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
                  ].join(' ')}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error.message}
                </p>
              )}

              <Button type="submit" size="lg" isLoading={isPending} className="w-full mt-1">
                {isPending ? 'Creating workspace…' : 'Create workspace'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
