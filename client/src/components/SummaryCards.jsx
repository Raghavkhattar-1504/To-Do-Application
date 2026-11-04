import { CheckBoxIcon, CrossBoxIcon } from './icons.jsx';

function SummaryCard({ label, count, icon, className, iconClassName }) {
  const known = typeof count === 'number';
  return (
    <div
      role="group"
      aria-label={known ? `${label}: ${count} this week` : `${label}: not available`}
      className={`rounded p-4 ${className}`}
    >
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className={`flex h-7 w-7 items-center justify-center rounded ${iconClassName}`}>{icon}</span>
        <span className="text-xs text-ink">{label}</span>
      </div>
      <p className="mt-3 flex items-baseline gap-2" aria-hidden="true">
        <span className="text-2xl font-semibold text-ink">{known ? String(count).padStart(2, '0') : '--'}</span>
        <span className="text-[10px] text-ink-muted">This Week</span>
      </p>
    </div>
  );
}

export default function SummaryCards({ completed, pending }) {
  return (
    <section aria-label="This week's summary" className="grid grid-cols-2 gap-3">
      <SummaryCard
        label="Task Complete"
        count={completed}
        className="bg-complete-bg"
        iconClassName="bg-complete-icon/25 text-brand"
        icon={<CheckBoxIcon className="h-5 w-5" />}
      />
      <SummaryCard
        label="Task Pending"
        count={pending}
        className="bg-pending-bg"
        iconClassName="bg-pending-icon/20 text-pending-icon"
        icon={<CrossBoxIcon className="h-5 w-5" />}
      />
    </section>
  );
}
