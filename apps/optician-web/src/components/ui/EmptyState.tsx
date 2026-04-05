import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8' : 'py-16',
        className
      )}
    >
      <div
        className={cn(
          'rounded-2xl bg-primary-50 flex items-center justify-center mb-6',
          isCompact ? 'w-14 h-14' : 'w-20 h-20'
        )}
      >
        <Icon
          className={cn(
            'text-primary-500',
            isCompact ? 'w-7 h-7' : 'w-10 h-10'
          )}
        />
      </div>
      <h3
        className={cn(
          'font-semibold text-gray-900',
          isCompact ? 'text-base' : 'text-xl'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-gray-500 mt-1 max-w-sm',
            isCompact ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              to={action.href}
              className="btn-primary inline-flex items-center gap-2"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="btn-primary inline-flex items-center gap-2"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
