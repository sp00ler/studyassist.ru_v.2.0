// Scroll-reveal start state for framer-motion's `initial`. On the server it is
// `false`, so the HTML ships with the content visible — crawlers that don't run
// JS would otherwise index these blocks as opacity:0 text. In the browser the
// block starts hidden and fades in on scroll as before.
export const revealFrom = <T,>(from: T): T | false =>
  typeof window === 'undefined' ? false : from
