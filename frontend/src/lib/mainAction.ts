import { useAuth } from '../context/auth'
import { useLang } from '../context/language'

/**
 * The one main action, in one place.
 *
 * It has to read the same words in the nav, the hero, the close and the
 * phone bar — so it is written once and read from there, rather than typed
 * out five times and drifting.
 *
 * It changes with what the visitor can actually do. A guest cannot order:
 * prices are behind approval, so their action is the application. An
 * approved partner can, so theirs is the order. Each visitor still sees one
 * action, in the same words, everywhere.
 */
export function useMainAction(): { label: string; to: string } {
  const { t } = useLang()
  const { isApproved } = useAuth()

  return isApproved
    ? { label: t('Place an order', 'Κάντε παραγγελία'), to: '/catalogue' }
    : { label: t('Apply for trade pricing', 'Αίτηση για τιμές χονδρικής'), to: '/apply' }
}
