# Deployment Guide — Coolify + Cloudflare

## Prerequisites
- Hetzner CX22 (or any VPS) with Coolify installed
- Domain pointed to the server via Cloudflare DNS
- GitHub repository connected to Coolify

---

## 1. Connect GitHub repo to Coolify

1. Open Coolify dashboard → **Projects** → **New Project**
2. Choose **Docker Compose** as deployment type
3. Connect your GitHub repo and select the `main` branch
4. Set the compose file to `docker-compose.prod.yml`

---

## 2. Set environment variables in Coolify

In Coolify's **Environment Variables** panel, add:

| Variable | Value |
|---|---|
| `DOMAIN_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://yourdomain.com` |
| `DB_PASSWORD` | a strong random password |

Generate a strong password with:
```bash
openssl rand -base64 32
```

---

## 3. Configure domain in Coolify

1. Go to your project → **Domains**
2. Add your domain (e.g. `eshop.yourdomain.com`)
3. Coolify handles SSL automatically via Let's Encrypt

---

## 4. Configure Cloudflare

1. In Cloudflare DNS, add an **A record** pointing your domain to the Hetzner server IP
2. Set proxy status to **DNS only** (grey cloud) — not proxied
   - Coolify manages SSL itself; Cloudflare proxying can interfere

---

## 5. Deploy

Click **Deploy** in Coolify. It will:
1. Pull the latest code from `main`
2. Build the Docker images
3. Start all services (Postgres, backend, frontend)
4. Seed demo products and orders on first run

---

## 6. Verify

- Open `https://yourdomain.com` — storefront should load
- Open `https://yourdomain.com/admin` — log in with `admin@test.com` / `admin1234`
- Check analytics charts show data

---

## Updating the live site

Push to `main` → Coolify auto-redeploys.

For day-to-day work use the `dev` branch, then merge to `main` when ready:
```bash
git checkout dev       # work here
git checkout main
git merge dev
git push origin main   # triggers auto-deploy
```

---

## Resetting the database

If you need a clean slate (e.g. wipe demo data):

1. In Coolify, stop the project
2. Delete the `eshop_pg` volume
3. Redeploy — Flyway migrations and demo seeder run fresh
