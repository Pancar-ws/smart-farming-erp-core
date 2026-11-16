// src/components/ui/Skeleton.tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-control bg-gray-200/80 ${className}`}
    />
  );
}

