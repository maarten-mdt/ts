import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <section className="text-center py-16 sm:py-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-100 tracking-tight">
          Precision shooter's utility platform
        </h1>
        <p className="mt-4 text-stone-400 max-w-xl mx-auto">
          Find ranges, gunsmiths, track NFA wait times, and verify parts compatibility — all in one place.
        </p>
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex rounded-lg border border-stone-700 bg-surface-elevated overflow-hidden">
            <input
              type="text"
              placeholder="City or ZIP..."
              className="flex-1 px-4 py-3 bg-transparent text-stone-100 placeholder-stone-500 outline-none"
              readOnly
              aria-label="Location search"
            />
            <button
              type="button"
              className="px-4 py-3 bg-accent text-white font-medium hover:bg-accent-light transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        {[
          { to: '/ranges', title: 'Find a Range', desc: 'Ranges by distance and location' },
          { to: '/gunsmiths', title: 'Find a Gunsmith', desc: 'Vetted gunsmiths by specialty' },
          { to: '/nfa-tracker', title: 'NFA Tracker', desc: 'Form 4 wait times by examiner' },
          { to: '/compatibility', title: 'Parts Compatibility', desc: 'Chassis, barrels, actions' },
        ].map(({ to, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="block p-6 rounded-lg border border-stone-700 bg-surface-elevated hover:border-stone-600 hover:bg-surface-muted transition-colors"
          >
            <h2 className="font-semibold text-stone-100">{title}</h2>
            <p className="mt-1 text-sm text-stone-500">{desc}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
