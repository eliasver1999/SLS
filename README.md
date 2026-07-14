# SLS — Sound. Lights. Screens.

B2B event-technology storefront for **SLS** (LED screens & video walls, stage
lighting, pro sound). The frontend is a faithful React port of the SLS prototype:
bilingual **EN/ΕΛ**, guest/approved/admin access with pricing gating, and buy/rent
product flows.

- **`frontend/`** — React + TypeScript + Vite SPA. Design system ported 1:1 from
  the prototype (`src/sls.css`).
- **`backend/`** — Laravel 13 JSON API + SQLite with **Sanctum token auth and
  admin/customer roles**. Serves **products** (full CRUD; catalogue is live from
  the DB), **partner applications + approvals**, plus inquiries (Contact) and
  services, and **orders** (quotes / orders / rentals) placed by signed-in
  customers. Admin endpoints (product write, approvals, order status) are
  protected by `auth:sanctum` + an `admin` middleware. Only the dashboard's
  invoice figure remains illustrative.

## Auth & roles

Login is real (Sanctum bearer tokens). Two seeded accounts (`php artisan db:seed`):

| Role | Email | Password | Can |
|------|-------|----------|-----|
| **admin** | `admin@sls.gr` | `password` | Manage products (add/edit/delete), review approvals |
| **customer** | `maria@novaevents.gr` | `password` | See pricing, member dashboard |

The React app stores the token in `localStorage`, sends it as `Authorization:
Bearer`, and gates: guests see specs (pricing hidden), customers see pricing +
`/dashboard`, admins get `/admin`. Routes `/dashboard` (any signed-in) and
`/admin` (admin only) are guarded client-side; the API enforces the same
server-side. Register a customer via `POST /api/register`.

## Frontend pages

Home · Solutions · Catalogue (filters + buy/rent toggle) · Product (gallery,
buy/rent modes, **interactive** rental calendar, quote drawer) · Apply (→ pending) ·
About · Projects · Contact (**wired to `POST /api/inquiries`**) · Order received ·
Dashboard (approved partner) · Admin (member approvals) · UI-Kit · Sitemap.

The prototype pointed Projects/About/Contact at the sitemap; those are now real
pages, and the Contact form persists to the Laravel inquiries API.

- **i18n:** `src/context/language.tsx` — `useLang().t(en, el)`, persisted, toggled
  from the header. **Auth/pricing gating:** `src/context/auth.tsx` — role
  (guest/approved/admin) is mirrored to `body[data-auth]`, which the CSS keys
  `.guest-only` / `.approved-only` off (as in the prototype). "Login" and visiting
  the Dashboard set the approved role; Admin sets the admin role.
- **Data:** `src/data/products.ts` (catalogue/product content, both languages).

## Brand system

| Token | Value | Use |
|-------|-------|-----|
| Electric Blue | `#1F8BFF` | primary / logo / accents |
| Sky Highlight | `#57C2FF` | accent |
| Deep Blue | `#0A4FC4` | support |
| Charcoal | `#121A28` | panels |
| Near-Black | `#05070D` | background (dark by default) |
| Platinum White | `#FFFFFF` | text |

Type: **Poppins** (display, caps + tracking) · **Inter** (body). The prototype's
custom brand fonts weren't available, so per the brandbook these Google Fonts are
loaded in `index.html`.

## Running locally

Requires Node 20+, PHP 8.2+, Composer. (Windows: Laragon provides PHP + Composer.)

### Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env          # first time only
php artisan key:generate      # first time only
php artisan migrate
php artisan db:seed            # products + sample partner applications
php artisan serve --port=8001 # http://127.0.0.1:8001
```

DB defaults to SQLite (`database/database.sqlite`, created automatically). To use
MySQL instead, set `DB_CONNECTION=mysql` + credentials in `.env` and re-migrate.

### Frontend (React SPA)

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies `/api/*` → `http://127.0.0.1:8001` in dev (see `vite.config.ts`).
For production, set `VITE_API_URL` to the deployed backend origin.

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST`  | `/api/login` · `/api/register` | public | Auth → `{ token, user }` |
| `GET`   | `/api/me` · `POST /api/logout` | user | Current user / sign out |
| `GET`   | `/api/services` | public | The three capabilities |
| `GET`   | `/api/products` (`?category=`,`?featured=1`) · `/api/products/{slug}` | public | Catalogue (bilingual) |
| `POST`/`PUT`/`DELETE` | `/api/products[/{slug}]` | **admin** | Product CRUD |
| `POST`  | `/api/inquiries` | public | Contact enquiry |
| `GET`   | `/api/inquiries` | **admin** | List enquiries |
| `POST`  | `/api/partner-applications` | public | Submit a B2B application |
| `GET`   | `/api/partner-applications` (`?status=`) | **admin** | List + status counts |
| `PATCH` | `/api/partner-applications/{id}` | **admin** | Approve / reject |
| `GET`   | `/api/orders` (`?type=`,`?status=`) | user | Own requests (admin: all) |
| `POST`  | `/api/orders` | user | Place a quote / order / rental request |
| `PATCH` | `/api/orders/{id}` | **admin** | Update status / total |

**Orders** are one model with `type` = `quote` \| `order` \| `rental` and a
`status` (`pending`→`quoted`→`confirmed`→`in_production`→`completed`/`cancelled`).
The product page wires **Submit order request** → order, **Request booking** →
rental, **Add to quote** → a client-side quote cart, and the drawer's **Request
quote** → quote. The customer dashboard and the admin Orders/Quotes/Rentals tabs
read them live; admins change status from a dropdown.

Products carry bilingual JSON fields (`tag`, `blurb`, specs, `buy`/`rent`) and the
`ProductResource` emits the exact shape the React `Product` type expects. The FE
loads products from the API with the bundled data as an offline fallback.

Run `php artisan db:seed` to load 2 users, 6 products, 3 sample pending
applications and 4 demo orders.

## Automated emails

Placing an order triggers transactional email (Mailables in `app/Mail`, markdown
templates in `resources/views/mail/orders`):

- **Customer** — `OrderReceived`: confirmation with payment terms — a
  **{deposit}% deposit** to the **IBAN** on Scope-of-Work signing, the remaining
  balance before dispatch/delivery, ex-VAT pricing. (For a *quote* request it
  instead promises a formal quote within one business day.)
- **Sales** (`SLS_SALES_EMAIL`) — `NewOrderNotification`: heads-up to follow up.
- **Customer** — `OrderStatusUpdated`: sent whenever an admin changes the order
  status from the dashboard.

Business values (IBAN, sales email, deposit %, VAT %) live in `config/sls.php`
(overridable via `SLS_*` in `.env`). `MAIL_MAILER=log` by default, so emails
render into `storage/logs/laravel.log` — set real SMTP creds in `.env` to send for
real. (Contact/inquiry and partner-application notifications still log via
`Log::info`; convert to Mailables the same way when needed.)

Note: `QUEUE_CONNECTION=database` but the Mailables are **not** queued, so they
send synchronously with no worker. Make them `ShouldQueue` + run
`php artisan queue:work` if you'd rather send them in the background.
