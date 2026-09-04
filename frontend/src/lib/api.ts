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
export type MemberStatus = 'pending' | 'approved' | 'rejected'
export type AuthUser = {
  id: number
  name: string
  email: string
  role: Role
  company: string | null
  status: MemberStatus
  // Admin-gated: true once an admin approves the account (always true for admins).
  // Pricing, cart and ordering stay locked until this is true.
  approved: boolean
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

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/forgot-password', { email })
  return data
}

export async function resetPassword(payload: {
  token: string
  email: string
  password: string
  password_confirmation: string
}) {
  const { data } = await api.post<{ message: string }>('/reset-password', payload)
  return data
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

// ── Pagination ────────────────────────────────────────────────────
export type Paginated<T> = { items: T[]; page: number; lastPage: number; total: number }

type PageMeta = { current_page?: number; last_page?: number; total?: number }

function toPage<T>(data: { data: T[]; meta?: PageMeta }): Paginated<T> {
  return {
    items: data.data,
    page: data.meta?.current_page ?? 1,
    lastPage: data.meta?.last_page ?? 1,
    total: data.meta?.total ?? data.data.length,
  }
}

// ── Products ──────────────────────────────────────────────────────
export async function fetchProducts(params?: {
  category?: Category
  featured?: boolean
  page?: number
  per_page?: number
}) {
  const { data } = await api.get<{ data: Product[]; meta?: PageMeta }>('/products', { params })
  return toPage(data)
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

// ── Orders / quotes ───────────────────────────────────────────────
export type OrderType = 'quote' | 'order'
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
  price?: string
}

export type StatusEvent = {
  status: OrderStatus
  note: string | null
  at: string
  by: string
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
  status_history: StatusEvent[]
  created_at: string
}

export async function createOrder(payload: { type: OrderType; items: OrderItem[]; notes?: string }) {
  const { data } = await api.post<{ data: Order }>('/orders', payload)
  return data.data
}

export async function fetchOrders(params?: {
  type?: OrderType
  status?: OrderStatus
  page?: number
  per_page?: number
}) {
  const { data } = await api.get<{ data: Order[]; meta?: PageMeta }>('/orders', { params })
  return toPage(data)
}

export async function fetchOrder(id: number | string) {
  const { data } = await api.get<{ data: Order }>(`/orders/${id}`)
  return data.data
}

export async function cancelOrder(id: number) {
  const { data } = await api.post<{ data: Order }>(`/orders/${id}/cancel`)
  return data.data
}

export async function updateOrder(
  id: number,
  patch: { status?: OrderStatus; total?: string | null; note?: string; items?: OrderItem[] },
) {
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

// ── Members (registration approvals) ──────────────────────────────
export type Member = {
  id: number
  name: string
  email: string
  company: string | null
  status: MemberStatus
  created_at: string
}

export type MemberCounts = {
  pending: number
  approved: number
  rejected: number
}

export async function fetchMembers(params?: { status?: MemberStatus; page?: number }) {
  const { data } = await api.get<{ data: Member[]; counts: MemberCounts; meta?: PageMeta }>('/users', {
    params,
  })
  return { ...toPage(data), counts: data.counts }
}

export async function updateMember(id: number, status: MemberStatus) {
  const { data } = await api.patch<{ data: Member }>(`/users/${id}`, { status })
  return data.data
}

// ── Transactional email templates ─────────────────────────────────
export type EmailTemplate = {
  event: string
  label: string
  group: string
  description: string
  audience: string
  /** Placeholder names this event exposes, e.g. "reference" → {{ reference }}. */
  placeholders: string[]
  /** Structural block keys this event allows an admin to toggle. */
  available_blocks: string[]
  subject: string
  body: string
  blocks: string[]
  enabled: boolean
  /** False when the event is still using the shipped default copy. */
  customised: boolean
  default_subject: string
  default_body: string
  default_blocks: string[]
}

export type EmailTemplateDraft = {
  subject: string
  body: string
  blocks: string[]
  enabled?: boolean
}

export async function fetchEmailTemplates() {
  const { data } = await api.get<{ data: EmailTemplate[]; blocks: Record<string, string> }>(
    '/email-templates',
  )
  return data
}

export async function saveEmailTemplate(event: string, draft: EmailTemplateDraft) {
  const { data } = await api.put<{
    data: { event: string; unknown_placeholders: string[] } & EmailTemplateDraft
  }>(`/email-templates/${event}`, draft)
  return data.data
}

/** Drop the override so the event falls back to the shipped default copy. */
export async function resetEmailTemplate(event: string) {
  const { data } = await api.delete<{ data: EmailTemplateDraft & { event: string } }>(
    `/email-templates/${event}`,
  )
  return data.data
}

export async function previewEmailTemplate(event: string, draft?: Partial<EmailTemplateDraft>) {
  const { data } = await api.post<{
    data: { subject: string; html: string; unknown_placeholders: string[] }
  }>(`/email-templates/${event}/preview`, draft ?? {})
  return data.data
}

export async function sendTestEmail(
  event: string,
  draft?: Partial<EmailTemplateDraft> & { to?: string },
) {
  const { data } = await api.post<{ message: string }>(
    `/email-templates/${event}/test`,
    draft ?? {},
  )
  return data.message
}

export default api
