# Sports Bar Admin Dashboard

A premium, Linear/Vercel/Stripe-inspired admin dashboard with a dark sidebar and light content area. Built on this project's stack (TanStack Start + React + TypeScript + Tailwind + shadcn/ui), with Zustand, Axios, Recharts, and html5-qrcode. Role-based access for **Admin** (own venue) and **Super Admin** (whole platform).

> Framework note: this Lovable project runs on **TanStack Start**, not Next.js App Router (Next.js isn't supported here). All other requested libraries are used as-is. Routing/auth use TanStack equivalents — file-based routes, `beforeLoad` guards, and a router-context auth state.

## API strategy (important)
You're connecting an existing external API, but the base URL and endpoint shapes aren't defined yet. To avoid blocking the build:
- A typed Axios client reads `VITE_API_BASE_URL` and injects the JWT (`Authorization: Bearer`).
- Each domain (auth, orders, menu, events, games, users, bookings, analytics, notifications) gets a typed service module.
- A single `VITE_USE_MOCKS` flag swaps each service between real HTTP and realistic in-memory mock data, so the entire UI is fully interactive on day one.
- When you share the real endpoints/base URL, swapping is localized to the service modules — components don't change.

## Design system
- **Palette:** dark slate sidebar (`#0B0F19`/`#111726`), light content (`#FAFAFA`/white cards), primary blue accent (`#2563EB`), status colors green/red/orange/amber only for badges. All as semantic tokens in `src/styles.css` (oklch) — no hardcoded color classes.
- **Type:** Inter (or similar refined sans) via `@fontsource`, tight headings, comfortable body.
- **Shape & spacing:** 8px grid, 12–16px radii, subtle shadows, generous whitespace.
- **Components:** KPI cards, data tables (search/filter/sort/pagination/row actions), charts, modals/dialogs, confirmation dialogs, toasts (sonner), loading skeletons, button hierarchy (primary/secondary/danger).
- **Motion:** subtle, fast transitions on hover, sidebar collapse, and dialog open.

## Auth & roles
- Login page: email + password, JWT login, "Remember me", loading state, inline error messages, redirect to Dashboard on success.
- Session in Zustand (persisted; "Remember me" controls localStorage vs sessionStorage). Token attached to all requests via Axios interceptor; 401 → auto sign-out + redirect to Login.
- Route protection via a pathless `_authenticated` layout (`beforeLoad` redirect to `/login`). Super-Admin-only routes gated by a role check.
- Roles: `user`, `admin`, `super_admin`. Admin sees venue-scoped data; Super Admin sees platform-wide pages and data.

## Layout
- Collapsible dark sidebar (icons + labels, collapses to icon rail), top header (page title, search, notifications bell, user menu with role badge + sign out), light scrollable content area. Fully responsive (sidebar becomes a drawer on mobile).
- **Admin nav:** Dashboard, Orders, Menu & Inventory, Events, Games, Users, QR Scanner, Analytics, Settings.
- **Super Admin extra nav:** Bars, Platform Users, Platform Revenue, Platform Analytics, System Settings.

## Pages / features (v1)
1. **Dashboard** — KPI cards (Revenue, Orders, Active Events, Users, Inventory Alerts), recent activity feed, quick-action buttons, mini revenue/orders charts.
2. **Orders** — table with search/filter/sort/pagination; order detail dialog; status workflow (Pending → Accepted → Preparing → Ready → Completed / Cancelled) with status badges.
3. **Menu & Inventory** — CRUD menu items, categories, price management, out-of-stock toggle, enable/disable, low-stock alerts.
4. **Events** — CRUD events, date/time, banner upload, ticket price, capacity, publish/unpublish.
5. **Games** — CRUD games, enable/disable, schedules, icon upload.
6. **Users** — list/search, block/unblock, view booking history + order history in a detail drawer.
7. **QR Scanner** — camera scan via html5-qrcode; parse payload `{ bookingId, userId, eventId, tableNumber, status }`; validate booking (exists, paid, not expired, not already used, not cancelled); on success show customer details + "Entry Approved", mark Checked In, increment attendance, record check-in time + scanning admin; duplicate-scan prevention; success/error sound + vibration; auto-advance to next scan; scan history/audit log.
8. **Notifications** — compose & send announcements, match reminders, order-ready notifications; sent history.
9. **Analytics** — revenue summary, orders summary, event attendance, popular menu items (Recharts: line/bar/area + top-items list), date-range filter.
10. **Settings** — venue profile, staff, preferences (Admin); **Super Admin**: Bars (venues CRUD), Platform Users, Platform Revenue, Platform Analytics, System Settings.

## Build order
1. Install deps (zustand, axios, recharts, html5-qrcode, @fontsource font, date utils). Set up design tokens + fonts.
2. Axios client + interceptors + service-layer scaffolding with mock adapters and shared TypeScript types.
3. Auth store + Login page + `_authenticated` layout guard + role gating + router context.
4. App shell: sidebar (role-aware) + header + responsive drawer + reusable DataTable, KPI card, page header, confirm dialog, skeletons.
5. Pages in this order: Dashboard → Orders → Menu & Inventory → Events → Games → Users → QR Scanner → Analytics → Notifications → Settings (incl. Super Admin pages).
6. Polish: empty states, loading skeletons, toasts, responsive passes, accessibility.

## Technical notes
- File-based routes under `src/routes/` (e.g. `_authenticated.dashboard.tsx`, `_authenticated.orders.tsx`, Super-Admin under a role-gated pathless layout).
- TanStack Query for data fetching/caching; services called from loaders (`ensureQueryData`) + components (`useSuspenseQuery`) and mutations via `useMutation` + cache invalidation.
- Zustand only for auth/session + UI prefs (sidebar collapsed); server data stays in Query.
- Zod validation on all forms (login, menu, events, games, settings).
- QR scanning runs client-side only (html5-qrcode needs the browser camera).

## What I need from you (later, not blocking)
- API base URL and endpoint shapes (auth, orders, menu, events, games, users, bookings, analytics, notifications) to switch off mocks. Until then the app runs fully on mock data.
