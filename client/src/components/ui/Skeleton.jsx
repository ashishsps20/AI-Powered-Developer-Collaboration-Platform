import React from 'react';

export const SkeletonLine = ({ className = '', width = 'w-full' }) => (
  <div className={`h-4 rounded skeleton-shimmer ${width} ${className}`} />
);

export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <div className={`rounded-full skeleton-shimmer ${size} ${className}`} />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl border border-surface-200 p-5 space-y-3 ${className}`}>
    <SkeletonLine width="w-2/3" />
    <SkeletonLine width="w-full" />
    <SkeletonLine width="w-1/2" />
  </div>
);

export const SkeletonTableRow = ({ cols = 4, className = '' }) => (
  <div className={`flex items-center gap-4 py-3.5 px-4 ${className}`}>
    {Array.from({ length: cols }).map((_, i) => (
      <SkeletonLine key={i} width={i === 0 ? 'w-1/3' : 'w-1/4'} />
    ))}
  </div>
);

export const SkeletonList = ({ rows = 5, cols = 4 }) => (
  <div className="divide-y divide-surface-100">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} cols={cols} />
    ))}
  </div>
);

const Skeleton = { Line: SkeletonLine, Circle: SkeletonCircle, Card: SkeletonCard, TableRow: SkeletonTableRow, List: SkeletonList };
export default Skeleton;
