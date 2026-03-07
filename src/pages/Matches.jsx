export default function Matches() {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold text-stone-100">Matches & Events</h1>
      <p className="mt-4 text-stone-500">Coming soon — PRS/NRL and local precision rifle matches by state.</p>
      <div className="mt-8 max-w-sm mx-auto">
        <input
          type="email"
          placeholder="Email for updates"
          className="w-full px-4 py-3 rounded-lg border border-stone-700 bg-surface-elevated text-stone-100 placeholder-stone-500 outline-none"
          readOnly
        />
        <button
          type="button"
          className="mt-3 w-full py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-light transition-colors"
        >
          Notify me
        </button>
      </div>
    </div>
  )
}
