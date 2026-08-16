// components/dashboard/ChartSkeleton.tsx
'use client'

interface Props {
  height?: number
  titleWidth?: number
}

export function ChartSkeleton({ height = 224, titleWidth = 160 }: Props) {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-5 rounded mb-4" style={{ background: 'var(--bg-muted)', width: titleWidth }} />
      <div className="rounded" style={{ background: 'var(--bg-muted)', height }} />
    </div>
  )
}