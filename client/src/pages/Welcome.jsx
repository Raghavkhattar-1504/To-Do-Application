import { useNavigate } from 'react-router-dom';

function Chevrons({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 72" fill="none" aria-hidden="true">
      {[0, 18, 36, 54].map((y) => (
        <path
          key={y}
          d={`M0 ${y + 14} L15 ${y} L30 ${y + 14} L45 ${y} L60 ${y + 14} L75 ${y} L90 ${y + 14} L105 ${y} L120 ${y + 14}`}
          stroke="currentColor"
          strokeWidth="5"
        />
      ))}
    </svg>
  );
}

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative min-h-[55vh] flex-[2] overflow-hidden bg-brand" aria-hidden="true">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border-[14px] border-white/20" />
        <Chevrons className="absolute left-0 top-16 w-32 text-white/20" />
        <Chevrons className="absolute bottom-8 right-0 w-32 text-white/20" />
      </section>

      <section className="flex flex-1 flex-col px-6 pb-8 pt-8">
        <h1 className="text-2xl font-semibold text-ink">Manage What To Do</h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>

        <button
          type="button"
          onClick={() => navigate('/home', { replace: true })}
          className="mt-auto w-full rounded bg-brand py-3.5 text-sm font-medium text-white transition hover:bg-brand-strong focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          Get Started
        </button>
      </section>
    </main>
  );
}
