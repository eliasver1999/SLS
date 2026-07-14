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
  count: number
  add: (item: CartItem) => void
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

  const add = useCallback((item: CartItem) => setItems((prev) => [...prev, item]), [])
  const remove = useCallback(
    (index: number) => setItems((prev) => prev.filter((_, i) => i !== index)),
    [],
  )
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartValue>(
    () => ({ items, count: items.length, add, remove, clear }),
    [items, add, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
