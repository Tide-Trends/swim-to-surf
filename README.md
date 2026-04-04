# Swim to Surf

Private swimming lessons website with an integrated booking system.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setup

### 1. Supabase (Database)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy your URL and anon key
4. Update `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. To create admin accounts, go to **Authentication → Users** and create users for Lukaah and Estee

### 2. Resend (Email Notifications)

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Update `.env.local`:

```
RESEND_API_KEY=re_your_api_key
```

### 3. Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add the environment variables from `.env.local`
4. Deploy

### 4. Stripe (Optional, Future)

The site is pre-wired for Stripe. To enable:

1. `npm install stripe @stripe/stripe-js`
2. Set `FEATURES.stripeEnabled = true` in `src/lib/constants.ts`
3. Add Stripe keys to `.env.local`
4. Uncomment the Stripe logic in `src/app/api/create-checkout/route.ts`

## Pages

- **/** — Home page
- **/about** — About, philosophy, instructor bios
- **/book** — Booking wizard
- **/faq** — Frequently asked questions
- **/contact** — Contact form
- **/admin** — Dashboard (protected, requires login)

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS v4
- Supabase (Postgres + Auth)
- Resend (email)
- Framer Motion (animations)
- ics (calendar file generation)
