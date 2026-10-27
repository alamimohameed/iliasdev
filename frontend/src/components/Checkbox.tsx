import type { TaskType } from '../types';
import { TASK_TYPE_META } from '../utils/tasks';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  type: TaskType;
  label: string;
  size?: 'sm' | 'md';
}

export function Checkbox({ checked, onToggle, type, label, size = 'md' }: CheckboxProps) {
  const meta = TASK_TYPE_META[type];
  const box = size === 'sm' ? 'h-4 w-4 rounded-[5px]' : 'h-5 w-5 rounded-md';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`grid shrink-0 place-items-center border-2 transition active:scale-90 ${box} ${
        checked ? meta.checked : `${meta.borderStrong} bg-white hover:bg-paper`
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
