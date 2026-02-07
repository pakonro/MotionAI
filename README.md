# MotionAI

An AI SaaS platform that generates videos from images using the WaveSpeedAI API.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database & Auth**: Convex (reactive backend + Convex Auth) - *Optional - app works in demo mode without it*
- **Payments**: Stripe (Credit-based system) - *Currently disabled, will be integrated later*
- **File Storage**: Convex file storage - *Optional - uses localStorage in demo mode*

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Convex (Optional - app works in demo mode without it)
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

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

### 3. Convex Setup (Optional - For Production)

To enable full functionality with authentication and database:

1. Install Convex CLI and create a deployment: `npx convex dev` (Node 20+ required)
2. Convex will create `convex/` and add `NEXT_PUBLIC_CONVEX_URL` to `.env.local`
3. Auth and file storage are built in; no separate buckets needed
4. Point WaveSpeed webhook to your Convex HTTP URL: `https://<deployment>.convex.site/wavespeed`

### 4. Stripe Setup (Optional - Currently Disabled)

**Note**: Stripe integration is currently commented out. You can test the app using the "Add Test Credits" button on the dashboard. To enable Stripe later:

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Implement Stripe in Convex: `convex/http.ts` (POST /stripe), `internal.profiles.addCredits`, and checkout creation in an action or mutation
4. Update `app/actions/create-checkout.ts` and `components/buy-credits-button.tsx` to call Convex
5. Point Stripe webhook to your Convex HTTP URL: `https://<deployment>.convex.site/stripe`

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
│   │   └── webhooks/     # Webhook endpoints (e.g. Stripe)
│   ├── auth/             # Auth callback routes
│   ├── dashboard/        # Dashboard page
│   ├── gallery/          # Gallery page
│   └── login/            # Login page
├── components/
│   └── layout/           # Layout components
├── convex/               # Convex backend (schema, queries, mutations, HTTP, crons)
├── lib/
│   ├── convex.ts         # Convex env check (isConvexConfigured)
│   ├── demo-mode.ts      # localStorage demo mode
│   └── stripe.ts         # Stripe client
└── types/                # (Convex types from convex/_generated when using npx convex codegen)
```

## Features

- ✅ Demo mode - works without Convex or Stripe setup
- ✅ User authentication (Email/Password via Convex Auth) - *requires Convex*
- ✅ Credit-based system (Stripe integration disabled for now - use "Add Test Credits" button)
- ✅ Image upload and video generation
- ✅ Real-time generation status updates
- ✅ Video gallery with status tracking
- ✅ Responsive dashboard with sidebar navigation
- ✅ Test credits button for development/testing
- ✅ localStorage-based demo mode for quick testing

## Database Schema (Convex)

### `profiles`
- `userId` (references users)
- `credits` (number)
- `stripeCustomerId` (optional string)
- `_creationTime` (Convex managed)

### `generations`
- `userId` (references users)
- `prompt` (optional string)
- `inputImageUrl` (string)
- `outputVideoUrl` (optional string)
- `status` ('pending' | 'completed' | 'failed')
- `wavespeedId` (optional string)
- `errorMessage` (optional string)
- `_creationTime` (Convex managed)

## API Routes

### Next.js
- **`/api/webhooks/stripe`** – Placeholder; when enabled, use Convex HTTP `/stripe` instead.

### Convex HTTP (when Convex is configured)
- **POST `/wavespeed`** – Receives video generation callbacks from WaveSpeedAI and updates generation records.
- **POST `/stripe`** – Stub; implement for Stripe checkout completion and adding credits.

## Server Actions

### `generateVideo(imageUrl: string, prompt?: string)`
- Checks user credits (Convex or demo)
- Deducts 1 credit
- Creates generation record (Convex or demo)
- Calls WaveSpeedAI API
- Handles errors and refunds credits if needed

### `createCheckoutSession()`
- Disabled; when re-enabled, use Convex mutation/action and Convex HTTP `/stripe` webhook.
