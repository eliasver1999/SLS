import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../context/language'
import { Pencil } from 'lucide-react'
import {
  fetchEmailTemplates,
  previewEmailTemplate,
  resetEmailTemplate,
  saveEmailTemplate,
  sendTestEmail,
  type EmailTemplate,
} from '../lib/api'
import { errorMessage } from '../lib/errors'

type Draft = { subject: string; body: string; blocks: string[]; enabled: boolean }

/**
 * Admin editor for the transactional emails (joining, new order, order
 * progress). Admins write copy with {{ placeholders }} and toggle code-owned
 * blocks; the markup itself stays in the backend's mail layout.
 */
export default function EmailTemplates() {
  const { t } = useLang()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [blockLabels, setBlockLabels] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [preview, setPreview] = useState<{ subject: string; html: string; unknown: string[] } | null>(
    null,
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  // Caret position to restore after an insert re-renders the textarea, so
  // clicking several placeholders in a row appends instead of stacking them.
  const [caret, setCaret] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchEmailTemplates()
      setTemplates(res.data)
      setBlockLabels(res.blocks)
      setSelected((prev) => prev ?? res.data[0]?.event ?? null)
    } catch {
      setMsg({ kind: 'err', text: t('Could not load templates.', 'Αδυναμία φόρτωσης προτύπων.') })
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const current = templates.find((x) => x.event === selected) ?? null

  // Re-seed the draft whenever the selection changes or templates reload
  // (which happens right after a successful save or reset).
  useEffect(() => {
    if (!current) {
      setDraft(null)
      return
    }
    setDraft({
      subject: current.subject,
      body: current.body,
      blocks: current.blocks,
      enabled: current.enabled,
    })
    setPreview(null)
    setMsg(null)
  }, [current])

  const groups = useMemo(() => {
    const out: Record<string, EmailTemplate[]> = {}
    for (const tpl of templates) {
      if (!out[tpl.group]) out[tpl.group] = []
      out[tpl.group].push(tpl)
    }
    return out
  }, [templates])

  const dirty =
    !!current &&
    !!draft &&
    (draft.subject !== current.subject ||
      draft.body !== current.body ||
      draft.enabled !== current.enabled ||
      draft.blocks.join(',') !== current.blocks.join(','))

  useEffect(() => {
    if (caret === null) return
    bodyRef.current?.focus()
    bodyRef.current?.setSelectionRange(caret, caret)
    setCaret(null)
  }, [caret])

  function insertPlaceholder(name: string) {
    const el = bodyRef.current
    if (!draft) return
    const token = `{{ ${name} }}`
    const start = el?.selectionStart ?? draft.body.length
    const end = el?.selectionEnd ?? start
    setDraft({ ...draft, body: draft.body.slice(0, start) + token + draft.body.slice(end) })
    setCaret(start + token.length)
  }

  function toggleBlock(key: string) {
    if (!draft) return
    setDraft({
      ...draft,
      blocks: draft.blocks.includes(key)
        ? draft.blocks.filter((b) => b !== key)
        : [...draft.blocks, key],
    })
  }

  async function run(kind: string, fn: () => Promise<void>) {
    setBusy(kind)
    setMsg(null)
    try {
      await fn()
    } catch (e) {
      setMsg({
        kind: 'err',
        text: errorMessage(e, t('Something went wrong.', 'Κάτι πήγε λάθος.')),
      })
    } finally {
      setBusy(null)
    }
  }

  const save = () =>
    run('save', async () => {
      if (!current || !draft) return
      const res = await saveEmailTemplate(current.event, draft)
      await load()
      setMsg(
        res.unknown_placeholders.length
          ? {
              kind: 'err',
              text: t(
                `Saved, but these placeholders aren't available here: ${res.unknown_placeholders.join(', ')}`,
                `Αποθηκεύτηκε, αλλά δεν υποστηρίζονται: ${res.unknown_placeholders.join(', ')}`,
              ),
            }
          : { kind: 'ok', text: t('Saved.', 'Αποθηκεύτηκε.') },
      )
    })

  const reset = () =>
    run('reset', async () => {
      if (!current) return
      await resetEmailTemplate(current.event)
      await load()
      setMsg({ kind: 'ok', text: t('Restored the default copy.', 'Επαναφορά προεπιλογής.') })
    })

  const doPreview = () =>
    run('preview', async () => {
      if (!current || !draft) return
      const res = await previewEmailTemplate(current.event, {
        subject: draft.subject,
        body: draft.body,
        blocks: draft.blocks,
      })
      setPreview({ subject: res.subject, html: res.html, unknown: res.unknown_placeholders })
    })

  const doTest = () =>
    run('test', async () => {
      if (!current || !draft) return
      const message = await sendTestEmail(current.event, {
        subject: draft.subject,
        body: draft.body,
        blocks: draft.blocks,
      })
      setMsg({ kind: 'ok', text: message })
    })

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Emails', 'Emails')}
      </h1>
      <p className="muted">
        {t(
          'Edit the automatic emails customers receive. Write copy with placeholders like {{ reference }} — they are filled in when the email is sent.',
          'Επεξεργαστείτε τα αυτόματα emails. Χρησιμοποιήστε placeholders όπως {{ reference }} — συμπληρώνονται κατά την αποστολή.',
        )}
      </p>

      <div className="email-editor">
        {/* Event list */}
        <div className="panel" style={{ padding: 12 }}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 14 }}>
              <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px' }}>
                {group}
              </div>
              {items.map((tpl) => (
                <button
                  key={tpl.event}
                  onClick={() => setSelected(tpl.event)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    textAlign: 'left',
                    background: tpl.event === selected ? 'rgba(31,139,255,.16)' : 'transparent',
                    color: 'inherit',
                    border: 0,
                    borderRadius: 8,
                    padding: '8px 8px',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 13,
                  }}
                >
                  <span style={{ flex: 1 }}>{tpl.label}</span>
                  {!tpl.enabled && <span className="status rej">{t('Off', 'Ανενεργό')}</span>}
                  {tpl.enabled && tpl.customised && <span className="status ok" title={t('Customised', 'Προσαρμοσμένο')}>
                      <Pencil size={10} aria-hidden />
                    </span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Editor */}
        {current && draft && (
          <div>
            <div className="panel">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <b>{current.label}</b>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {current.description}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                  />
                  {t('Send this email', 'Αποστολή')}
                </label>
              </div>

              {!draft.enabled && (
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {t(
                    'Switched off — customers will not receive anything for this event.',
                    'Ανενεργό — δεν θα αποστέλλεται τίποτα για αυτό το γεγονός.',
                  )}
                </p>
              )}

              <div className="field mt16">
                <label>{t('Subject', 'Θέμα')}</label>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                />
              </div>

              <div className="field mt16">
                <label>{t('Body (markdown)', 'Κείμενο (markdown)')}</label>
                <textarea
                  ref={bodyRef}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={14}
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.55, resize: 'vertical' }}
                />
              </div>

              <div className="mt16">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  {t('Insert a placeholder', 'Εισαγωγή placeholder')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {current.placeholders.map((p) => (
                    <button
                      key={p}
                      onClick={() => insertPlaceholder(p)}
                      className="btn btn-ghost btn-sm"
                      title={`{{ ${p} }}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {current.available_blocks.length > 0 && (
                <div className="mt16">
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    {t('Include', 'Να περιλαμβάνονται')}
                  </div>
                  {current.available_blocks.map((key) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0' }}>
                      <input
                        type="checkbox"
                        checked={draft.blocks.includes(key)}
                        onChange={() => toggleBlock(key)}
                      />
                      {blockLabels[key] ?? key}
                    </label>
                  ))}
                </div>
              )}

              <div className="mt24" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={save} disabled={!dirty || busy !== null}>
                  {busy === 'save' ? t('Saving…', 'Αποθήκευση…') : t('Save', 'Αποθήκευση')}
                </button>
                <button className="btn btn-ghost" onClick={doPreview} disabled={busy !== null}>
                  {busy === 'preview' ? t('Rendering…', 'Απόδοση…') : t('Preview', 'Προεπισκόπηση')}
                </button>
                <button className="btn btn-ghost" onClick={doTest} disabled={busy !== null}>
                  {busy === 'test' ? t('Sending…', 'Αποστολή…') : t('Send test to me', 'Δοκιμαστικό σε εμένα')}
                </button>
                {current.customised && (
                  <button className="btn btn-ghost" onClick={reset} disabled={busy !== null} style={{ marginLeft: 'auto' }}>
                    {t('Reset to default', 'Επαναφορά')}
                  </button>
                )}
              </div>

              {dirty && (
                <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  {t('Unsaved changes.', 'Μη αποθηκευμένες αλλαγές.')}
                </p>
              )}
              {msg && (
                <p style={{ fontSize: 13, marginTop: 10, color: msg.kind === 'ok' ? 'var(--ok)' : 'var(--danger)' }}>
                  {msg.text}
                </p>
              )}
            </div>

            {preview && (
              <div className="panel mt24">
                <div className="muted" style={{ fontSize: 12 }}>
                  {t('Subject', 'Θέμα')}
                </div>
                <b style={{ fontSize: 14 }}>{preview.subject}</b>
                {preview.unknown.length > 0 && (
                  <p style={{ fontSize: 13, marginTop: 8, color: 'var(--danger)' }}>
                    {t('Unknown placeholders: ', 'Άγνωστα placeholders: ')}
                    {preview.unknown.join(', ')}
                  </p>
                )}
                {/* Sandboxed so the email's own CSS can't leak into the admin UI. */}
                <iframe
                  title="email preview"
                  srcDoc={preview.html}
                  sandbox=""
                  style={{ width: '100%', height: 560, border: 0, borderRadius: 10, marginTop: 12, background: '#fff' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
