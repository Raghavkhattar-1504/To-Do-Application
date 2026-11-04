export default function DayStrip({ days, selectedIso, todayIso, onSelect }) {
  return (
    <div role="group" aria-label="Days of this week" className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const selected = day.iso === selectedIso;
        const isToday = day.iso === todayIso;
        return (
          <button
            key={day.iso}
            type="button"
            aria-pressed={selected}
            aria-current={isToday ? 'date' : undefined}
            aria-label={`${day.weekday} ${day.dayOfMonth}${isToday ? ', today' : ''}`}
            onClick={() => onSelect(day.iso)}
            className={`flex flex-col items-center gap-1 rounded py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              selected ? 'bg-brand text-white' : 'text-ink-muted hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px]">{day.weekday}</span>
            <span className={`text-sm ${selected ? 'font-semibold' : ''}`}>
              {String(day.dayOfMonth).padStart(2, '0')}
            </span>
            <span
              className={`h-1 w-1 rounded-full ${
                isToday ? (selected ? 'bg-white' : 'bg-brand') : 'bg-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
