import api from './api'

/**
 * Reports browser errors to the API so the team learns about a broken page
 * without a customer having to phone in.
 *
 * Sends with fetch + keepalive rather than through the axios instance,
 * because the most valuable report is the one from a page that is in the
 * middle of falling over or being navigated away from — keepalive is the
 * only way that request survives the unload.
 */

/** Errors already sent this page-load, so a loop does not become a flood. */
const seen = new Set<string>()

/** Set while a report is in flight: a failure to report must never recurse. */
let reporting = false

const MAX_PER_PAGE = 10

export type ClientError = {
  type?: string
  message: string
  file?: string
  line?: number
  stack?: string
}

export async function reportClientError(error: ClientError) {
  const key = `${error.type}|${error.message}|${error.file}|${error.line}`

  if (reporting || seen.has(key) || seen.size >= MAX_PER_PAGE) return

  seen.add(key)
  reporting = true

  try {
    const body = JSON.stringify({
      ...error,
      url: window.location.pathname,
      // Which bundle it happened on — a stack trace against a build that no
      // longer exists cannot be read.
      release: import.meta.env.VITE_RELEASE || undefined,
    })

    await fetch(`${api.defaults.baseURL ?? '/api'}/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    // Nothing sensible to do: the reporting channel is the thing that failed.
  } finally {
    reporting = false
  }
}

/**
 * Catch what React cannot: errors outside the component tree, and rejected
 * promises nobody handled.
 */
export function installErrorReporting() {
  window.addEventListener('error', (event) => {
    // Failed image and script loads also fire this, with no error object.
    if (!event.error && !event.message) return

    reportClientError({
      type: event.error?.name ?? 'Error',
      message: event.message || String(event.error),
      file: event.filename,
      line: event.lineno,
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason

    // A rejected API call is usually a handled outcome shown to the user —
    // a validation error or an expired session — not a defect. Reporting
    // those would drown the real crashes.
    if (reason?.isAxiosError) return

    reportClientError({
      type: reason?.name ?? 'UnhandledRejection',
      message: reason?.message ?? String(reason),
      stack: reason?.stack,
    })
  })
}
