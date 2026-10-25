# S'Mart Retail Website (React)

The shop owners' website: the same features as the Flutter app, in the browser on laptop or phone.
Talks to `../smart-retail-backend` (the same API, accounts, prices and orders as the app).

React 19 · TypeScript · Vite 8 · React Router 8 · TanStack Query 5 · Tailwind CSS 4 · Vitest

## Run

Start the backend first (`cd ../smart-retail-backend && ./gradlew bootRun`), then:

```bash
npm install
npm run dev        # http://localhost:5174
```

The Vite dev server forwards `/api` and `/uploads` to `http://localhost:8080` (change with `BACKEND_URL=...`).
The backend's dev settings allow this address (`app.cors.allowed-origins` in `application-dev.yml`).

```bash
npm test           # unit and page tests (no backend needed)
npm run lint
npm run build      # production build in dist/
```

If `node` is not found in a new terminal, load nvm first: `source ~/.nvm/nvm.sh`.

## Pages

| Page | Login needed | What it does |
|---|---|---|
| `/` Home | No | Store open/closed, offer banners, categories, special deals, new arrivals |
| `/shop` | No | Search, sort, category and deals filters, paging; filters are kept in the URL |
| `/product/:slug` | No | Photos, bulk price table, case count with live price and saving, add to cart |
| `/cart` | No | Server prices for every line, coupon, delivery and minimum order; "Sign in to checkout" for visitors |
| `/login`, `/register` | No | Email or mobile + password; returns to the page you came from (e.g. checkout) |
| `/checkout` | Yes | Address (add new), cash on delivery / UPI with screenshot / credit, note, place order |
| `/orders`, `/orders/:id` | Yes | My orders and order tracking; `?placed=1` shows the "Order placed" page |
| `/profile` | Yes | Details, addresses, sign out |

On phones the site shows a bottom menu like the app; on laptops a top menu with search and the cart.

## How it works

- **Cart** (`src/cart/cart.ts`): kept in this browser's localStorage, synced across open tabs. It stores only products and
  case counts; separate from the phone app's cart.
- **Prices** (`src/cart/useQuote.ts`): every cart change asks the server (`POST /api/checkout/quote`), which also works for
  visitors who are not signed in. The order is sent with the total the user saw, so a price change is refused, not charged.
- **Login** (`src/api/client.ts`, `src/auth/`): access token in memory, refresh token in localStorage, refreshed once on 401.

## Layout

```
src/
├── api/        client.ts (fetch + token refresh), shop.ts (all calls), types.ts
├── auth/       AuthProvider, useAuth, RequireAuth (send visitors to sign in), safeFrom
├── cart/       cart store in localStorage, coupon, useQuote (server prices)
├── components/ Layout (header, footer, bottom menu), ProductCard, ProductImage, QuantityStepper, OrderSummary, ui
├── lib/        formatting and bulk-price rules, order labels, address rules
├── pages/      one file per page (+ AddressForm)
└── test/       test setup, fake backend and sample data
```
