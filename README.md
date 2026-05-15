# OpenColdCase

A collaborative cold case investigation platform where enthusiasts can research unsolved cases together.

## What it is

**OpenColdCase** is a public web platform centered around an interactive map of the United States. Each pin on the map represents a real unsolved cold case. Anyone can browse the map and read case details; registered members can contribute to investigations.

### Key features

- **US case map** — Leaflet-powered interactive map with color-coded pins by case status (unsolved, cold, active, solved)
- **Case folders** — Each case has its own page with a full description, metadata (location, date, victim), and a tabbed workspace
- **Discussion** — Public threaded conversation on each case, open to all registered members
- **Evidence** — Community-submitted links, documents, and files related to a case
- **Theories** — Upvotable theory posts where members share their analysis
- **Private notebook** — A personal notes area on each case visible only to its owner — never shared
- **Case submission** — Any registered user can submit a new cold case to the map

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router, TypeScript) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Database + Auth | [Supabase](https://supabase.com) (PostgreSQL + Row Level Security) |
| Map | [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/opencoldcase.git
   cd opencoldcase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root (this file is gitignored and must never be committed):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the database schema**

   In your Supabase SQL Editor, run the full schema (tables: `profiles`, `cases`, `discussions`, `evidence`, `theories`, `notebooks`, `theory_upvotes`) with Row Level Security policies.

5. **Start the dev server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Database RLS summary

| Table | Public read | Auth insert | Edit / delete |
|---|---|---|---|
| `profiles` | ✓ | auto on signup | owner only |
| `cases` | ✓ | ✓ | case creator only |
| `discussions` | ✓ | ✓ | author only |
| `evidence` | ✓ | ✓ | author only |
| `theories` | ✓ | ✓ | author only |
| `notebooks` | owner only | owner only | owner only |
| `theory_upvotes` | ✓ | ✓ | owner only |

## Contributing

Pull requests are welcome. Please open an issue first to discuss significant changes.

## License

MIT
