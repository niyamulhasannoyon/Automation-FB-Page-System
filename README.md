# AutoPage — Multi-Tenant Facebook Page Automation SaaS

A production-ready, ultra-fast **Multi-Tenant Facebook Page Automation SaaS** platform engineered with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB (Mongoose)**, and **Zustand**.

Empowers businesses and creators to connect multiple Facebook Pages via a seamless **"Bring Your Own Token" (BYOT)** flow without requiring Meta OAuth review initially. Built for high-throughput automated comment replies (public + private Messenger DM), Messenger conversations, and automated post scheduling using the **Meta Graph API v21.0**.

---

## ⚡ Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router, Route Handlers, Server Components)
- **Language:** TypeScript 5.7+
- **Styling:** Tailwind CSS 3.4 (Dark-mode Glassmorphic aesthetic, custom neon glows, linear transitions)
- **Database:** MongoDB with Mongoose (cached connection pooling optimized for serverless)
- **State Management:** Zustand 5.0 (multi-tenant page switching, active rule states, interactive test simulator, modals, toasts)
- **Icons & Motion:** Lucide React & Framer Motion
- **Meta API:** Meta Graph API `v21.0`

---

## 🚀 Key Features

1. **Bring Your Own Token (BYOT) Onboarding:**
   - Connect any Facebook Page in seconds using `Page ID` and `Page Access Token`.
   - Real-time token verification via `GET https://graph.facebook.com/v21.0/${pageId}`.
   - Automatic webhook subscription via `POST https://graph.facebook.com/v21.0/${pageId}/subscribed_apps` with fields: `feed`, `messages`, `messaging_postbacks`.

2. **Multi-Tenant Meta Webhook Engine (`/api/webhook`):**
   - **`GET /api/webhook`**: Standard Meta challenge handshake with `hub.verify_token`.
   - **`POST /api/webhook`**: High-speed real-time event router:
     - Multi-tenant tenant lookup via `entry.id`.
     - **Comment Automation (`entry.changes`)**: Automatically detects comments (`item === 'comment' && verb === 'add'`), ignores comments by the page itself, matches against keyword rules (`exact` or `contains`), and dispatches:
       - Public comment reply: `POST /{comment_id}/comments`
       - Private Messenger reply: `POST /{pageId}/messages` with `recipient: { comment_id }`
     - **Messenger Automation (`entry.messaging`)**: Listens to user inbox messages (ignoring `is_echo`), matches keyword rules, or falls back to the customized `defaultInboxReply`.

3. **Keyword Rules Builder:**
   - Add, edit, toggle, and delete rules with keyword triggers and match strategies (`exact` strict vs `contains` broad).
   - Integrated live test simulator to verify matching behavior in real time before saving.

4. **Post Studio & Publishing Scheduler:**
   - Split-screen composer with live, pixel-accurate Facebook post feed preview card.
   - Choose between **Instant Live Publishing** or **Scheduled Post Queue**.
   - Handles both text posts (`/{pageId}/feed`) and photo uploads (`/{pageId}/photos`).

5. **Automated Cron Worker (`/api/cron/publish`):**
   - Polls `ScheduledPost` collection for records where `status === 'pending'` and `scheduledTime <= new Date()`.
   - Dispatches posts via Graph API v21.0 and records status and Facebook post ID.
   - Protected via `CRON_SECRET` authorization.

6. **Ultra-Modern Glassmorphic UI:**
   - Dark mode (`bg-slate-950`), `backdrop-blur-xl`, `border-white/10`, neon blue/indigo accents.
   - Multi-tenant top header Page Switcher with instant page context switching.
   - Master pause/resume switch for each page's automations.

---

## 📁 Project Directory Structure

```
fb-page-automation/
├── .env.example
├── .env.local
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   └── placeholder-avatar.png
└── src/
    ├── app/
    │   ├── (dashboard)/
    │   │   ├── layout.tsx                # Dashboard layout with Sidebar & Header
    │   │   ├── page.tsx                  # Overview Dashboard (Stats cards, status, quick actions)
    │   │   ├── rules/
    │   │   │   └── page.tsx              # Comment & Inbox Rules Builder + Default Reply
    │   │   ├── posts/
    │   │   │   └── page.tsx              # Post Studio & Scheduler (split-screen + queue)
    │   │   └── settings/
    │   │       └── page.tsx              # Page Settings & Webhook Health Inspector
    │   ├── api/
    │   │   ├── pages/
    │   │   │   ├── route.ts              # GET: list all connected pages
    │   │   │   ├── connect/
    │   │   │   │   └── route.ts          # POST: Verify credentials & auto-subscribe page
    │   │   │   └── [id]/
    │   │   │       └── route.ts          # GET/PATCH/DELETE page configuration
    │   │   ├── webhook/
    │   │   │   └── route.ts              # GET: challenge verification; POST: real-time event router
    │   │   ├── posts/
    │   │   │   ├── route.ts              # GET: query posts for a page
    │   │   │   └── publish/
    │   │   │       └── route.ts          # POST: instant publish or add to ScheduledPost
    │   │   └── cron/
    │   │       └── publish/
    │   │           └── route.ts          # GET: execute scheduled posts worker
    │   ├── globals.css                   # Glassmorphic utilities, neon glows, scrollbars
    │   └── layout.tsx                    # Root HTML layout with ambient gradients
    ├── components/
    │   ├── common/
    │   │   ├── Badge.tsx                 # Status pill badge
    │   │   ├── Button.tsx                # Glassmorphic action button with loading states
    │   │   ├── Card.tsx                  # Glass panel containers
    │   │   ├── Switch.tsx                # Animated toggle switch with glow
    │   │   └── Toast.tsx                 # Zustand-driven alert notifications
    │   ├── dashboard/
    │   │   ├── ConnectPageModal.tsx      # BYOT Modal with Graph API explorer guide
    │   │   ├── Header.tsx                # Top bar with Page Switcher & live pause toggle
    │   │   ├── PageSwitcher.tsx          # Multi-tenant dropdown selector
    │   │   ├── Sidebar.tsx               # Navigation sidebar
    │   │   └── StatCard.tsx              # Metric cards with neon glows
    │   ├── posts/
    │   │   ├── FacebookPostPreview.tsx   # Realistic Facebook post feed preview card
    │   │   ├── PostComposer.tsx          # Composer for caption, media URL, scheduling
    │   │   └── PostQueueTable.tsx        # Publishing queue & history with cron trigger
    │   └── rules/
    │   │   ├── RuleDrawer.tsx            # Keyword rule editor with live simulator
    │   │   └── RulesTable.tsx            # Interactive rules list with quick toggles
    ├── lib/
    │   ├── db.ts                         # Mongoose serverless connection pooling
    │   ├── meta-graph.ts                 # Meta Graph API v21.0 service wrapper
    │   └── utils.ts                      # Classnames helper (cn), rule matcher, dates
    ├── models/
    │   ├── ConnectedPage.ts              # ConnectedPage Mongoose schema & indexes
    │   └── ScheduledPost.ts              # ScheduledPost Mongoose schema & compound indexes
    ├── store/
    │   └── useAppStore.ts                # Zustand global state store
    └── types/
        └── index.ts                      # TypeScript definitions (Meta API, models, webhooks)
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js `18.x` or higher (Node 20+ recommended)
- MongoDB instance (local `mongodb://localhost:27017` or MongoDB Atlas)

### 2. Installation
```bash
# Clone and enter directory
cd "FB PAGE AUTOMATION"

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env.local` file with the following variables:
```env
# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/fb_page_automation

# Meta Webhook Configuration
META_WEBHOOK_VERIFY_TOKEN=fb_auto_verify_token_secure_2025

# Secret to protect scheduled cron worker endpoint
CRON_SECRET=cron_scheduler_secret_token_secure

# Public Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Meta Webhook Configuration Guide

1. Head over to [Meta for Developers](https://developers.facebook.com/apps/) and select your App.
2. In the sidebar, navigate to **Webhooks** &gt; **Page**.
3. Click **Edit Subscription**:
   - **Callback URL:** `https://your-domain.com/api/webhook` (or your active ngrok HTTPS URL for local development).
   - **Verify Token:** Value of `META_WEBHOOK_VERIFY_TOKEN` (default: `fb_auto_verify_token_secure_2025`).
4. Subscribe to the following fields:
   - `feed`
   - `messages`
   - `messaging_postbacks`
5. Click **Verify and Save**.
6. When you connect a page through the AutoPage UI, our backend automatically issues a `POST /{pageId}/subscribed_apps` call to link the page's event stream.

---

## ⏰ Automated Scheduled Posts Cron Setup

To run the scheduled posts processor automatically in production:

### Vercel Cron (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "* * * * *"
    }
  ]
}
```

### GitHub Actions or Linux Crontab
```bash
* * * * * curl -X GET "https://your-domain.com/api/cron/publish?secret=cron_scheduler_secret_token_secure"
```
Or click the **"Process Queue Now"** button directly inside the **Post Studio** view in the UI.
