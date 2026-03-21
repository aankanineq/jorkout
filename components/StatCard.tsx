type StatCardProps = {
  label: string
  value: string
  sub?: string
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-1"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <span className="text-[11px] uppercase tracking-wider font-medium"
        style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}
