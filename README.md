# X → Instagram Cross-Poster

A personal tool to share X (Twitter) posts to your Instagram account with a beautifully formatted 1080×1080 image card.

## How it works

1. Paste a public X/Twitter post URL
2. The tool fetches the post text and generates a styled Instagram image
3. Edit the caption if needed
4. Click "Post to Instagram" — done!

## Setup

### 1. Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in:
- `IG_ACCESS_TOKEN` — Your Instagram Graph API access token
- `IG_USER_ID` — Your Instagram Business/Creator account ID
- `IMGBB_API_KEY` — Free image hosting key from [api.imgbb.com](https://api.imgbb.com/)

### 2. imgbb API Key (Required)

Instagram's API requires a **publicly accessible image URL** — it can't use local files. imgbb is free and takes 30 seconds to set up:

1. Go to [https://api.imgbb.com/](https://api.imgbb.com/)
2. Sign up for free
3. Copy your API key
4. Add it to `.env.local` as `IMGBB_API_KEY`

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

Then set environment variables in Vercel dashboard:
- Settings → Environment Variables
- Add: `IG_ACCESS_TOKEN`, `IG_USER_ID`, `IMGBB_API_KEY`

### Option B: GitHub + Vercel Dashboard

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repo
4. Add environment variables in the setup wizard
5. Deploy!

## Instagram Requirements

- Your Instagram account must be a **Business or Creator** account
- The account must be linked to a Facebook Page
- Your access token must have `instagram_basic` and `instagram_content_publish` permissions

## Image Specs

Generated images are:
- **1080 × 1080 px** (square, optimal for Instagram feed)
- SVG-based card with gradient background
- Shows tweet text, author name, and @handle
- Automatically wraps long text

## Notes

- Only works with **public** X posts
- Instagram access tokens expire — you may need to refresh periodically
- The tool is for personal use only
