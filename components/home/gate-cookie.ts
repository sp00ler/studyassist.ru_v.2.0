// Set once the visitor has entered the site; app/page.tsx reads it server-side
// so returning visitors skip the RetroGate with no flash.
export const GATE_SEEN_COOKIE = 'sa_gate_seen'
