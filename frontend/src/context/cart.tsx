import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { OrderItem } from '../lib/api'

export type CartItem = OrderItem & { image?: string }

type CartValue = {
  items: CartItem[]
  /** Distinct lines, not total units — it labels the header badge. */
  count: number
  /** Estimated ex-VAT value of the basket, in cents. */
  subtotalCents: number
  add: (item: CartItem) => void
  setQty: (index: number, qty: number) => void
  remove: (index: number) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)
const KEY = 'sls.cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  // Adding a product already in the basket bumps its quantity rather than
  // creating a second line for the same thing.
  const add = useCallback(
    (item: CartItem) =>
      setItems((prev) => {
        const at = prev.findIndex((existing) => existing.slug === item.slug)

        if (at === -1) {
          return [...prev, { ...item, qty: Math.max(1, item.qty ?? 1) }]
        }

        return prev.map((existing, i) =>
          i === at
            ? { ...existing, qty: Math.max(1, (existing.qty ?? 1) + (item.qty ?? 1)) }
            : existing,
        )
      }),
    [],
  )

  const setQty = useCallback(
    (index: number, qty: number) =>
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, qty: Math.max(1, qty || 1) } : item)),
      ),
    [],
  )

  const remove = useCallback(
    (index: number) => setItems((prev) => prev.filter((_, i) => i !== index)),
    [],
  )
  const clear = useCallback(() => setItems([]), [])

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + (it.unit_price_cents ?? 0) * (it.qty ?? 1), 0),
    [items],
  )

  const value = useMemo<CartValue>(
    () => ({ items, count: items.length, subtotalCents, add, setQty, remove, clear }),
    [items, subtotalCents, add, setQty, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
