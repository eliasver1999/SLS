import axios from 'axios'
import type { Category, LS, Mode, Product, Spec } from '../data/products'

// In dev, Vite proxies /api → http://127.0.0.1:8001 (see vite.config.ts).
// In prod, set VITE_API_URL to the Laravel origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { Accept: 'application/json' },
})

/** Set/clear the Sanctum bearer token on the shared axios instance. */
export function setAuthToken(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

// ── Auth ──────────────────────────────────────────────────────────
export type Role = 'admin' | 'customer'
export type AuthUser = {
  id: number
  name: string
  email: string
  role: Role
  company: string | null
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: AuthUser }>('/login', { email, password })
  return data
}

export async function register(payload: {
  name: string
  email: string
  password: string
  company?: string
}) {
  const { data } = await api.post<{ token: string; user: AuthUser }>('/register', payload)
  return data
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser }>('/me')
  return data.user
}

export async function logoutApi() {
  await api.post('/logout')
}

export type InquiryPayload = {
  name: string
  email: string
  phone?: string
  event_type: string
  event_date?: string
  message: string
}

export type Inquiry = InquiryPayload & {
  id: number
  created_at: string
}

export async function createInquiry(payload: InquiryPayload) {
  const { data } = await api.post<{ data: Inquiry }>('/inquiries', payload)
  return data.data
}

export type ApiService = {
  slug: string
  name: string
  description: string
}

export async function fetchServices() {
  const { data } = await api.get<{ data: ApiService[] }>('/services')
  return data.data
}

// ── Products ──────────────────────────────────────────────────────
export async function fetchProducts(params?: { category?: Category; featured?: boolean }) {
  const { data } = await api.get<{ data: Product[] }>('/products', { params })
  return data.data
}

export async function fetchProduct(slug: string) {
  const { data } = await api.get<{ data: Product }>(`/products/${slug}`)
  return data.data
}

// Admin product mutations. Payload uses the backend's snake_case field names.
export type ProductInput = {
  slug: string
  name: string
  category: Category
  placement_key: string
  image: string
  tag: LS
  blurb: LS
  thumbs: string[]
  card_specs: Spec[]
  spec_table: Spec[]
  modes: Mode[]
  buy?: { price: string; unit: LS; leadTime: LS } | null
  rent?: { price: string; unit: LS } | null
  featured: boolean
}

export async function createProduct(input: ProductInput) {
  const { data } = await api.post<{ data: Product }>('/products', input)
  return data.data
}

export async function updateProduct(slug: string, input: Partial<ProductInput>) {
  const { data } = await api.put<{ data: Product }>(`/products/${slug}`, input)
  return data.data
}

export async function deleteProduct(slug: string) {
  await api.delete(`/products/${slug}`)
}

// ── Orders / quotes / rentals ─────────────────────────────────────
export type OrderType = 'quote' | 'order' | 'rental'
export type OrderStatus =
  | 'pending'
  | 'quoted'
  | 'confirmed'
  | 'in_production'
  | 'completed'
  | 'cancelled'

export type OrderItem = {
  slug: string
  name: string
  mode?: Mode
  qty?: number
  from?: string
  to?: string
  price?: string
}

export type Order = {
  id: number
  reference: string
  type: OrderType
  status: OrderStatus
  contact_name: string | null
  contact_email: string | null
  company: string | null
  items: OrderItem[]
  total: string | null
  notes: string | null
  created_at: string
}

export async function createOrder(payload: { type: OrderType; items: OrderItem[]; notes?: string }) {
  const { data } = await api.post<{ data: Order }>('/orders', payload)
  return data.data
}

export async function fetchOrders(params?: { type?: OrderType; status?: OrderStatus }) {
  const { data } = await api.get<{ data: Order[] }>('/orders', { params })
  return data.data
}

export async function updateOrder(id: number, patch: { status?: OrderStatus; total?: string | null }) {
  const { data } = await api.patch<{ data: Order }>(`/orders/${id}`, patch)
  return data.data
}

// ── Partner applications ──────────────────────────────────────────
export type PartnerApplicationPayload = {
  company: string
  vat?: string
  contact_name: string
  role?: string
  email: string
  phone?: string
  buys?: string[]
  message?: string
}

export type PartnerApplication = PartnerApplicationPayload & {
  id: number
  reference: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type ApplicationCounts = {
  pending: number
  approved: number
  rejected: number
}

export async function createPartnerApplication(payload: PartnerApplicationPayload) {
  const { data } = await api.post<{ data: PartnerApplication }>('/partner-applications', payload)
  return data.data
}

export async function fetchPartnerApplications(status?: string) {
  const { data } = await api.get<{ data: PartnerApplication[]; counts: ApplicationCounts }>(
    '/partner-applications',
    { params: status ? { status } : undefined },
  )
  return data
}

export async function updatePartnerApplication(
  id: number,
  status: 'approved' | 'rejected' | 'pending',
) {
  const { data } = await api.patch<{ data: PartnerApplication }>(`/partner-applications/${id}`, {
    status,
  })
  return data.data
}

export default api
