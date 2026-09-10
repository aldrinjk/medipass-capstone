export function LoadingScreen() {
  return (
    <main className="screen" aria-busy="true">
      <div className="spinner" role="status" aria-label="Loading emergency summary">
        <span className="visually-hidden">Loading…</span>
      </div>
      <p className="screen-subtitle">Loading emergency summary…</p>
    </main>
  )
}
