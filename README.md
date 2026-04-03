# Web-Based 1-on-1 Mentorship Platform

## Overview
Full-stack app for 1-on-1 mentorship sessions with booking, dashboards (mentor/student), and realtime rooms using Next.js, Supabase, Socket.io.

## Structure
- **client/**: Next.js 16 app (App Router).
  - Dashboard: `/dashboard/mentor`, `/dashboard/student`.
  - Sessions: Create/book, join via `/room/[id]`.
- **server/**: Express + Socket.io backend (`npm run dev` in root).
- Supabase for auth/DB.

## Quick Start
1. Setup Supabase (update `client/app/lib/supabase.ts` with your URL/key).
2. Root: `npm install && npm run dev` (starts server).
3. Client: `cd client && npm install && npm run dev` (localhost:3000).
4. Test: Login/create session as mentor, join as student.

## Scripts
- Root: `npm run dev` (nodemon server.js).
- Client: `npm run dev` (Next.js dev server).

Deploy client to Vercel; server to Railway/Render/etc.

