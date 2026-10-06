# Production Deployment Guide

## 1. Supabase Setup
1. Create a new Supabase Project.
2. Open the SQL Editor in Supabase Dashboard.
3. Run the initialization migration script located at [`supabase/migrations/20261006000000_init_schema.sql`](../supabase/migrations/20261006000000_init_schema.sql).
4. Run the seed data script located at [`supabase/seed/seed.sql`](../supabase/seed/seed.sql).
5. Copy the Project URL and Anon API key into your production environment variables.

## 2. Vercel Deployment
1. Connect your Git repository to Vercel.
2. In Project Settings ➔ Environment Variables, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_CAFE_NAME="Velvet Bloom Café"`
   - `NEXT_PUBLIC_CAFE_TAGLINE="Sip. Savor. Bloom."`
   - `NEXT_PUBLIC_TECH_BRAND="Powered by Kage Origin"`
   - `NEXT_PUBLIC_CURRENCY_SYMBOL="₹"`
3. Deploy!
