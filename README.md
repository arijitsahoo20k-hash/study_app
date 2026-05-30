# Study OS 🎓

A production-grade **Study Operating System** built with Next.js 14, Supabase, Framer Motion, and Tailwind CSS. Featuring a premium dark UI with ambient animations, Gemini-style backgrounds, and 8 fully-functional study modules.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📊 **Dashboard** | Stats overview, today's tasks, weekly chart, quick timer |
| ✅ **Tasks** | Priority-based todos, scheduling, day planning |
| ⏱ **Timer** | Pomodoro, Stopwatch, Countdown with session saving |
| 📈 **Analytics** | Study hours, task charts, streaks, insights |
| 📝 **Notes** | Markdown editor with pinning, archiving, search |
| 📖 **Mistakes** | Log & categorize errors, revision tracking |
| ⚡ **Exams** | Live countdown cards, prep status, syllabus |
| 👥 **Friends** | Study leaderboard, accountability, friend visibility |
| 📁 **Projects** | Multi-workspace organization |
| ⚙️ **Settings** | Profile, goals, preferences |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd studyos
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗 Architecture

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── auth/page.tsx             # Auth (sign in / sign up)
│   └── dashboard/
│       ├── layout.tsx            # Auth guard + AppLayout
│       ├── page.tsx              # Dashboard home
│       ├── todos/page.tsx        # Task management
│       ├── timer/page.tsx        # Timer (Pomodoro/Stopwatch/Countdown)
│       ├── analytics/page.tsx    # Charts and insights
│       ├── notes/page.tsx        # Note editor
│       ├── mistakes/page.tsx     # Mistake logger
│       ├── exams/page.tsx        # Exam countdown cards
│       ├── friends/page.tsx      # Social / accountability
│       ├── projects/page.tsx     # Project workspaces
│       └── settings/page.tsx    # User settings
├── components/
│   ├── animations/               # AmbientBackground, MouseGlow
│   ├── layout/                   # AppLayout, Providers, AuthProvider
│   ├── modules/                  # Feature-specific components
│   └── ui/                       # Base UI primitives
├── lib/
│   ├── supabase/                 # Client + server Supabase instances
│   ├── stores/                   # Zustand stores (auth, ui)
│   └── utils/                    # cn, dates, animations
├── styles/globals.css            # Design system + Tailwind
└── types/database.ts             # Full TypeScript DB types
```

---

## 🎨 Design System

- **Background**: `#050816` — deep space void
- **Primary**: Electric blue `#3B82F6`
- **Accent 1**: Soft purple `#8B5CF6`  
- **Accent 2**: Cyan `#06B6D4`
- **Font**: Geist Sans + Geist Mono
- **Animations**: Framer Motion with physics-based spring easings
- **Cards**: `bg-white/[0.03]` with subtle borders — no heavy glassmorphism

---

## 📱 PWA Setup

The app is PWA-ready. To generate icons (replace `logo.png` with your 512×512 icon):

```bash
npx pwa-asset-generator logo.png public/icons
```

---

## 🚢 Deploy to Vercel

```bash
npx vercel
```

Set the same env vars in Vercel dashboard under **Settings > Environment Variables**.

---

## 🗄 Database Schema

All tables use Row Level Security (RLS). Key tables:

- `profiles` — user data, streaks, goals
- `todos` — tasks with priority, scheduling, status
- `study_sessions` — logged timer sessions
- `notes` — markdown notes with pin/archive
- `mistakes` — error log with root cause tracking
- `exams` — upcoming exams with countdown
- `friendships` — social connections
- `projects` — multi-workspace organization

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 14 | App Router framework |
| `@supabase/ssr` | Auth + DB with SSR support |
| `framer-motion` | Animations |
| `@tanstack/react-query` | Data fetching & caching |
| `zustand` | Client state management |
| `recharts` | Analytics charts |
| `tailwindcss` | Styling |
| `next-pwa` | PWA support |
| `date-fns` | Date utilities |

---

## 🔒 Security

- All tables protected by Supabase RLS policies
- Server-side auth via middleware
- Friends can only view non-sensitive data (study minutes, task counts)
- No sensitive data exposed to friend queries

---

Made with ❤️ — Study OS
