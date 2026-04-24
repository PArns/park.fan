import { Skeleton } from '@/components/ui/skeleton';

export function AttractionCardSkeleton() {
  return (
    <article
      className="relative isolate flex min-h-[420px] flex-col overflow-hidden rounded-[20px] border border-black/[0.12] dark:border-white/10"
      style={{ boxShadow: 'var(--pk-card-shadow)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Favorite */}
      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>

      {/* Top glass panel */}
      <div
        className="relative z-[3] shrink-0 overflow-hidden"
        style={{
          padding: '14px 52px 13px 16px',
          background: 'var(--pk-panel)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          borderBottom: '1px solid var(--pk-panel-border)',
        }}
      >
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-[9px] flex gap-[6px]">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Spacer */}
      <div className="relative z-[2] flex-1" />

      {/* Bottom glass panel */}
      <div
        className="relative z-[3] shrink-0 overflow-hidden"
        style={{
          padding: '12px 14px 13px',
          background: 'var(--pk-panel)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          borderTop: '1px solid var(--pk-panel-border)',
        }}
      >
        <div className="flex gap-3">
          <div className="flex flex-col gap-1" style={{ width: 88 }}>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-1 h-2.5 w-full" />
          </div>
        </div>
        <div className="mt-2 h-px w-full" style={{ background: 'var(--pk-panel-border)' }} />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-1.5 h-3 w-1/2" />
      </div>
    </article>
  );
}
