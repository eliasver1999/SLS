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
  vat_number: string | null
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

export type ProfileInput = { name: string; company?: string | null; vat_number?: string | null }

/** Updates the signed-in member's own company details. */
export async function updateProfile(input: ProfileInput) {
  const { data } = await api.patch<{ user: AuthUser }>('/me', input)
  return data.user
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

export type InquiryStatus = 'new' | 'handled'

export type Inquiry = InquiryPayload & {
  id: number
  status: InquiryStatus
  created_at: string
}

export type InquiryCounts = { new: number; handled: number }

export async function createInquiry(payload: InquiryPayload) {
  const { data } = await api.post<{ data: Inquiry }>('/inquiries', payload)
  return data.data
}

export async function fetchInquiries(params?: { status?: InquiryStatus; page?: number }) {
  const { data } = await api.get<{ data: Inquiry[]; counts: InquiryCounts; meta?: PageMeta }>(
    '/inquiries',
    { params },
  )
  return { ...toPage(data), counts: data.counts }
}

export async function updateInquiry(id: number, status: InquiryStatus) {
  const { data } = await api.patch<{ data: Inquiry }>(`/inquiries/${id}`, { status })
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
  /** placement_key, e.g. "indoor" — only screens are classified this way. */
  placement?: string
  /** Inclusive pixel-pitch bounds in mm; excludes products with no pitch. */
  pitch_min?: number
  pitch_max?: number
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
  buy?: { unit: LS; leadTime: LS } | null
  buy_price_cents?: number | null
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
  /** How the customer wants it built, e.g. "4 × 3 panels (6 m²)". */
  configuration?: string | null
  /** Money is integer cents everywhere — never a float, never a string. */
  unit_price_cents?: number
  line_total_cents?: number
  /** Server-formatted for display; do not send these back. */
  unit_price?: string | null
  line_total?: string | null
}

export type StatusEvent = {
  status: OrderStatus
  note: string | null
  at: string
  by: string
}

/** When and where the job happens — required to place an order. */
export type EventDetails = {
  event_type?: string | null
  event_date?: string | null
  venue?: string | null
  delivery_address?: string | null
}

export type Order = EventDetails & {
  id: number
  reference: string
  type: OrderType
  status: OrderStatus
  contact_name: string | null
  contact_email: string | null
  company: string | null
  items: OrderItem[]
  currency: string
  subtotal_cents: number
  vat_percent: number
  vat_cents: number
  total_cents: number
  /** Formatted by the server so every screen renders the amount identically. */
  subtotal: string | null
  vat: string | null
  total: string | null
  notes: string | null
  status_history: StatusEvent[]
  documents?: OrderDocument[]
  created_at: string
}

export async function createOrder(
  payload: { type: OrderType; items: OrderItem[]; notes?: string } & EventDetails,
) {
  const { data } = await api.post<{ data: Order }>('/orders', payload)
  return data.data
}

export async function fetchOrders(params?: {
  type?: OrderType
  status?: OrderStatus
  /** Free-text across reference, company, contact, venue and event type. */
  q?: string
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
  // No total: it is derived from the lines server-side, so an invoice total
  // can never drift from what it is made of.
  patch: { status?: OrderStatus; note?: string; items?: OrderItem[] },
) {
  const { data } = await api.patch<{ data: Order }>(`/orders/${id}`, patch)
  return data.data
}

// ── Reporting ─────────────────────────────────────────────────────
/** All figures are ex VAT — the tax is not revenue. */
export type OrderReport = {
  currency: string
  headline: {
    pipeline_cents: number
    pipeline: string
    won_cents: number
    won: string
    open_count: number
    average_order_cents: number
    average_order: string
  }
  by_status: { status: OrderStatus; count: number; cents: number; value: string }[]
  by_type: { type: OrderType; count: number; cents: number; value: string }[]
  by_month: { month: string; label: string; count: number; cents: number; value: string }[]
}

export async function fetchOrderReport() {
  const { data } = await api.get<OrderReport>('/reports/orders')
  return data
}

// ── Order documents ───────────────────────────────────────────────
export type OrderDocumentKind = 'sow' | 'quote' | 'invoice' | 'other'

export type OrderDocument = {
  id: number
  kind: OrderDocumentKind
  name: string
  mime: string
  size: number
  created_at: string
}

export type MemberDocument = OrderDocument & {
  order: { id: number; reference: string; status: OrderStatus }
}

/** Every document across the member's own orders, newest first. */
export async function fetchMyDocuments(kind?: OrderDocumentKind) {
  const { data } = await api.get<{ data: MemberDocument[] }>('/documents', {
    params: kind ? { kind } : undefined,
  })
  return data.data
}

export async function changePassword(input: {
  current_password: string
  password: string
  password_confirmation: string
}) {
  const { data } = await api.patch<{ message: string }>('/me/password', input)
  return data.message
}

export async function uploadOrderDocument(
  orderId: number,
  file: File,
  kind: OrderDocumentKind = 'other',
) {
  const body = new FormData()
  body.append('file', file)
  body.append('kind', kind)
  const { data } = await api.post<{ data: OrderDocument }>(`/orders/${orderId}/documents`, body)
  return data.data
}

/**
 * Documents sit behind an authorization check, so they cannot be linked to
 * directly — a plain href carries no bearer token. Fetch the bytes, hand the
 * browser a blob, and revoke it once the download has started.
 */
export async function downloadOrderDocument(orderId: number, doc: OrderDocument) {
  const { data } = await api.get<Blob>(`/orders/${orderId}/documents/${doc.id}`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function deleteOrderDocument(orderId: number, documentId: number) {
  await api.delete(`/orders/${orderId}/documents/${documentId}`)
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
  vat_number: string | null
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
  // `delivered` is false when the request succeeded but the configured
  // transport swallows mail (MAIL_MAILER=log), so the caller can say so.
  const { data } = await api.post<{ message: string; delivered: boolean }>(
    `/email-templates/${event}/test`,
    draft ?? {},
  )
  return data
}

// ── Admin activity feed ───────────────────────────────────────────
export type ActivityKind =
  | 'order.placed'
  | 'quote.requested'
  | 'order.cancelled'
  | 'inquiry.received'
  | 'member.registered'
  | 'application.received'

export type ActivityEvent = {
  id: string
  kind: ActivityKind
  at: string
  title: string
  detail: string
  /** Which admin section deals with this event. */
  section: 'orders' | 'quotes' | 'inquiries' | 'members' | 'approvals'
  order_id?: number
  amount_cents?: number | null
  currency?: string | null
  /** Nobody has picked it up yet. */
  needs_action: boolean
  /** Arrived after this admin last opened the feed. */
  unread: boolean
}

export type Activity = {
  data: ActivityEvent[]
  unread_count: number
  seen_at: string | null
}

export async function fetchActivity() {
  const { data } = await api.get<Activity>('/activity')
  return data
}

/** Move this admin's read watermark to now. */
export async function markActivitySeen() {
  const { data } = await api.post<{ unread_count: number; seen_at: string }>('/activity/seen')
  return data
}

// ── Deployment health ─────────────────────────────────────────────
export type SystemCheck = {
  key: string
  label: string
  status: 'ok' | 'warn' | 'fail'
  detail: string
  /** What to change to make it pass. Empty when it already passes. */
  fix: string
}

export async function fetchSystemChecks() {
  const { data } = await api.get<{
    data: SystemCheck[]
    problems: SystemCheck[]
    passing: boolean
  }>('/system-checks')
  return data
}

// ── Error monitoring ──────────────────────────────────────────────
/**
 * A grouped error from the API's error_events table.
 *
 * Named ErrorReport rather than ErrorEvent because the DOM already has an
 * ErrorEvent, and shadowing it in a browser codebase is a trap.
 */
export type ErrorReport = {
  id: number
  source: 'api' | 'client'
  type: string
  message: string
  file: string | null
  line: number | null
  method: string | null
  url: string | null
  trace: string | null
  context: Record<string, unknown> | null
  occurrences: number
  first_seen_at: string | null
  last_seen_at: string | null
  resolved_at: string | null
  user: { name: string; email: string } | null
}

export type ErrorCounts = { open: number; resolved: number }

export async function fetchErrorEvents(state: 'open' | 'resolved' | 'all' = 'open') {
  const { data } = await api.get<{ data: ErrorReport[]; counts: ErrorCounts }>('/error-events', {
    params: { state },
  })
  return data
}

export async function resolveErrorEvent(id: number, resolved: boolean) {
  const { data } = await api.patch<{ data: ErrorReport }>(`/error-events/${id}`, { resolved })
  return data.data
}

export default api
