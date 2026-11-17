import type { ReactNode } from 'react'

/**
 * The account pages — sign in, create an account, forgot and reset a
 * password — on the storefront's system rather than the tooling's.
 *
 * One screen, the page's one split: what this page is for on the left, the
 * form on the right, on the surface ground so it reads as the thing to fill
 * in. They used to be a breadcrumb, an eyebrow ("MEMBER AREA"), a heading
 * and a lead in a band, then the form and a box of numbered "nodes" below
 * it — four devices for a page with one field set on it.
 */
export default function AuthLayout({
  id,
  title,
  lead,
  aside,
  children,
}: {
  id: string
  title: string
  lead: string
  /** Under the lead: a short list of facts or the way back. */
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="section auth" data-enter aria-labelledby={`${id}-h`}>
      <div className="wrap grid">
        <div className="span-5 stack-5">
          <div className="section-head">
            <h1 id={`${id}-h`}>{title}</h1>
            <p>{lead}</p>
          </div>
          {aside}
        </div>
        <div className="span-6 start-7 auth__panel">{children}</div>
      </div>
    </section>
  )
}

/** One labelled field, with the API's validation message under it. */
export function Field({
  id,
  label,
  error,
  full,
  children,
}: {
  id: string
  label: string
  error?: string | string[]
  full?: boolean
  children: ReactNode
}) {
  const message = Array.isArray(error) ? error[0] : error
  return (
    <div className={`field${full ? ' field--full' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {message ? <span className="field__error">{message}</span> : null}
    </div>
  )
}
