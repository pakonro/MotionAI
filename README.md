# MotionAI

An AI SaaS platform that generates videos from images using the WaveSpeedAI API.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth) - *Optional - app works in demo mode without it*
- **Payments**: Stripe (Credit-based system) - *Currently disabled, will be integrated later*
- **File Storage**: Supabase Storage - *Optional - uses localStorage in demo mode*

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase (Optional - app works in demo mode without it)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Optional - currently disabled)
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# WaveSpeedAI
WAVESPEED_API_URL=https://api.wavespeed.ai
WAVESPEED_API_KEY=your_wavespeed_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Quick Start (Demo Mode)

**You can run the app immediately without any setup!** The app will work in demo mode using localStorage:

1. Install dependencies: `npm install`
2. Run: `npm run dev`
3. Visit http://localhost:3000 - you'll be taken to the dashboard
4. Use the "Add Test Credits" button to add credits
5. Upload images and test the video generation flow

### 3. Supabase Setup (Optional - For Production)

To enable full functionality with authentication and database:

1. Create a new Supabase project at https://supabase.com
2. Run the migration file `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
3. Create two storage buckets:
   - `input-images` (public)
   - `generated-videos` (public)
4. Add your Supabase credentials to `.env.local`
5. Restart the development server

### 4. Stripe Setup (Optional - Currently Disabled)

**Note**: Stripe integration is currently commented out. You can test the app using the "Add Test Credits" button on the dashboard. To enable Stripe later:

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Uncomment Stripe-related code in:
   - `lib/stripe.ts`
   - `app/actions/create-checkout.ts`
   - `app/api/webhooks/stripe/route.ts`
   - `components/buy-credits-button.tsx`
   - `components/layout/header.tsx`
4. Set up a webhook endpoint pointing to `/api/webhooks/stripe`
5. Configure the webhook to listen for `checkout.session.completed` events

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
├── app/
│   ├── actions/          # Server actions
│   ├── api/
│   │   └── webhooks/     # Webhook endpoints
│   ├── auth/             # Auth callback routes
│   ├── dashboard/        # Dashboard page
│   ├── gallery/          # Gallery page
│   └── login/            # Login page
├── components/
│   └── layout/           # Layout components
├── lib/
│   ├── supabase/         # Supabase client utilities
│   └── stripe.ts         # Stripe client
├── supabase/
│   └── migrations/       # Database migrations
└── types/
    └── database.types.ts # Database TypeScript types
```

## Features

- ✅ Demo mode - works without Supabase or Stripe setup
- ✅ User authentication (Email/Password & Google OAuth) - *requires Supabase*
- ✅ Credit-based system (Stripe integration disabled for now - use "Add Test Credits" button)
- ✅ Image upload and video generation
- ✅ Real-time generation status updates
- ✅ Video gallery with status tracking
- ✅ Responsive dashboard with sidebar navigation
- ✅ Test credits button for development/testing
- ✅ localStorage-based demo mode for quick testing

## Database Schema

### `profiles`
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `credits` (INTEGER)
- `stripe_customer_id` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### `generations`
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `prompt` (TEXT, nullable)
- `input_image_url` (TEXT)
- `output_video_url` (TEXT, nullable)
- `status` (TEXT: 'pending' | 'completed' | 'failed')
- `wavespeed_id` (TEXT, nullable)
- `error_message` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMP)

## API Routes

### `/api/webhooks/stripe`
Handles Stripe checkout completion and adds credits to user profiles.

### `/api/webhooks/wavespeed`
Receives video generation completion callbacks from WaveSpeedAI and updates generation records.

## Server Actions

### `generateVideo(imageUrl: string, prompt?: string)`
- Checks user credits
- Deducts 1 credit
- Creates generation record
- Calls WaveSpeedAI API
- Handles errors and refunds credits if needed

### `createCheckoutSession()`
- Creates or retrieves Stripe customer
- Creates Stripe checkout session
- Returns checkout URL
