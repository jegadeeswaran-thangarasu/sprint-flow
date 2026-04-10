import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface CreateSprintButtonProps {
  nextSprintNumber: number;
  onCreate: (name: string) => void;
  isLoading: boolean;
}

const CreateSprintButton = ({ nextSprintNumber, onCreate, isLoading }: CreateSprintButtonProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(`Sprint ${nextSprintNumber}`);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, nextSprintNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create sprint
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 py-2 px-3 border border-blue-300 rounded-lg bg-blue-50"
    >
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-transparent text-sm focus:outline-none text-gray-900 min-w-0"
        placeholder="Sprint name"
      />
      <Button type="submit" size="sm" isLoading={isLoading} disabled={!name.trim()}>
        Create
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(false)}
        disabled={isLoading}
      >
        Cancel
      </Button>
    </form>
  );
};

export default CreateSprintButton;
