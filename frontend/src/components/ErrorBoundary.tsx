import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportClientError } from '../lib/reportError'

/**
 * Catches a render crash, tells the API, and shows something other than a
 * blank page.
 *
 * A thrown error in React unmounts the whole tree: the visitor got a white
 * screen and the team got nothing at all. This is the one place a class
 * component is still required — there is no hook equivalent.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError({
      type: error.name,
      message: error.message,
      // The component stack says which part of the page broke, which the
      // JavaScript stack of a minified bundle usually does not.
      stack: `${error.stack ?? ''}\n\nComponent stack:${info.componentStack ?? ''}`,
    })
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <section className="section">
        <div className="container center" style={{ maxWidth: 520 }}>
          <h1 className="h2">Something went wrong</h1>
          <p className="muted mt16">
            This page hit an error and our team has been told about it automatically. Reloading
            usually clears it.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            {/* A full navigation, not a router link: the router is part of
                the tree that just failed. */}
            <a className="btn btn-ghost" href="/">
              Back to the home page
            </a>
          </div>
        </div>
      </section>
    )
  }
}
