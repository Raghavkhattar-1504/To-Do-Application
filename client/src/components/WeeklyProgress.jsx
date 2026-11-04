export default function WeeklyProgress({ percent, total }) {
  const known = typeof percent === 'number';
  let valueText = 'Not available';
  if (known) valueText = total === 0 ? 'No tasks this week' : `${percent}% complete`;

  return (
    <section>
      <h2 className="text-base font-semibold text-ink">Weekly Progress</h2>
      <div
        role="progressbar"
        aria-label="Tasks completed this week"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={known ? percent : undefined}
        aria-valuetext={valueText}
        className="mt-3 h-4 w-full overflow-hidden bg-brand-soft"
      >
        <div
          className="h-full bg-brand-strong transition-[width] duration-300"
          style={{ width: `${known ? percent : 0}%` }}
        />
      </div>
    </section>
  );
}
