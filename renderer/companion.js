// A quiet transition detector. Startup and reconnects establish a baseline;
// inactivity is a pause, never proof that an agent finished its task.
;((root) => {
  function createActivityTracker({ now = Date.now, cooldown = 30000 } = {}) {
    const seen = new Map()
    let lastCue = -Infinity
    return {
      forget(provider) {
        seen.delete(provider)
      },
      observe(provider, data) {
        if (!data) {
          seen.delete(provider)
          return null
        }
        const next = { active: !!data.active, activity: data.activity || 'working' }
        const previous = seen.get(provider)
        seen.set(provider, next)
        if (!previous) return null
        const changed =
          next.active !== previous.active || (next.active && next.activity !== previous.activity)
        if (!changed || now() - lastCue < cooldown) return null
        lastCue = now()
        return { provider, activity: next.active ? next.activity : 'paused' }
      },
    }
  }
  // Activity freshness is separate from quota freshness. Ignore abandoned
  // activity snapshots.
  const FRESH_MS = 60000
  // `claude` is its last payload, or null while it isn't connected
  function currentActivity({ claude = null } = {}, now = Date.now()) {
    const fresh = (at) => Number.isFinite(at) && now - at <= FRESH_MS
    const working = !!claude?.active && fresh(claude.ts)
    return {
      providers: working ? ['claude'] : [],
      activity: (working && claude.activity) || 'working',
      sleeping: !!claude?.sleeping,
    }
  }
  const api = { createActivityTracker, currentActivity }
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.Companion = api
})(globalThis)
