import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200 rounded',
    animation === 'pulse' && 'animate-pulse',
    animation === 'shimmer' && 'skeleton',
    variant === 'circular' && 'rounded-full',
    variant === 'text' && 'rounded h-4',
    className
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return <div className={baseClasses} style={style} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <Skeleton width={80} height={24} className="rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
        <div className="space-y-2">
          <Skeleton variant="text" width={60} height={28} />
          <Skeleton variant="text" width={80} height={12} />
        </div>
      </div>
    </div>
  );
}
