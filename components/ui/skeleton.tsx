type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-linear-to-r from-slate-100 via-slate-200/70 to-slate-100 ${className}`}
      aria-hidden
    />
  );
}
