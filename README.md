# AI Powered Home Hospital Scheduling System — Frontend (Vite + React)

This folder contains a minimal Vite + React scaffold for the Thesis project landing page.

Live demo
-------

You can view the deployed frontend at:

https://home-hospital-scheduling-system.netlify.app/

(Note: this is a public deployment of the current frontend; it reads from the Supabase project configured by the environment variables.)

# AI Powered Home Hospital Scheduling System — Frontend (Vite + React)

This folder contains a minimal Vite + React scaffold for the Thesis project landing page. It is prepared to connect to Supabase.

What I created
- Clean, minimal project structure inside this folder.
- Landing page that displays: "AI Powered Home Hospital Scheduling System".
- `.env.example` with placeholders for Supabase keys.
- Supabase wiring: `src/lib/supabaseClient.js` and an example component `src/components/PatientsList.jsx` that reads from a `patients` table.

Files of interest
- `index.html` — app entry
- `src/main.jsx` — React entry
- `src/App.jsx` — landing page (renders `PatientsList` example)
- `src/index.css` — small styles
- `src/lib/supabaseClient.js` — Supabase client initializer
- `src/components/PatientsList.jsx` — example fetch/display component
- `package.json` — scripts and dependency pointers
- `.env.example` — supabase readiness

Quick run (PowerShell)
1. From this folder, install dependencies:

```powershell
cd D:\25A\25A\Thesis\AI-powered-Home-Hospital-Scheduling-System-FrontEnd
npm install
```

2. Create a local env file (copy from the example) and set your Supabase values:

```powershell
copy .env.example .env.local
notepad .env.local
# then paste your values for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

3. Start dev server:

```powershell
npm run dev
```

Open http://localhost:5173/ — the landing page will attempt to fetch rows from the `patients` table and display them.

How to create the sample `patients` table in Supabase

You can create the table using the Supabase SQL editor or the Table editor UI. Example SQL (run in Supabase SQL editor):

```sql
-- Create a simple patients table
create table if not exists public.patients (
	id serial primary key,
	name text,
	phone text,
	created_at timestamptz default now()
);

-- Optional: enable Row Level Security and allow anonymous SELECT for demo purposes
-- Only use this for quick local demos. For production, implement proper auth and policies.
alter table public.patients enable row level security;
create policy "Allow select for anon" on public.patients for select using (true);
```

Notes about RLS and security
- For production you should NOT leave tables open with a policy that returns true. Use Supabase Auth and create policies that check `auth.uid()` or other conditions.
- If you prefer, you can disable RLS for the demo table instead of adding a permissive policy.

How the frontend uses Supabase
- The client is initialized in `src/lib/supabaseClient.js` and reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env.
- The example component `PatientsList` performs a `supabase.from('patients').select('*')` to fetch rows and render a simple table.

Next steps I can take for you
- Wire authentication (Sign In / Sign Up) with Supabase Auth.
- Add CRUD UI for `patients` and other domain tables (doctors, schedules, visits).
- Harden policies and provide server-side APIs if you want to keep secrets out of the browser.

If you want, I can now:
1) Install the Supabase dependency and start the dev server (I will do that now), or
2) Just give more schema examples (doctors, schedules) before wiring.

Tell me which one you prefer and I'll proceed.
