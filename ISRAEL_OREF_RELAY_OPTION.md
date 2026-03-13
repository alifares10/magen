# Oref Israel-Only Relay Option

Use this option if Oref alerts ingestion fails from Railway/global egress with `403` because the source is reachable only from Israel.

## Goal

Keep the existing Railway alerts worker, but route Oref requests through a small relay hosted in Israel.

- Oref source: `https://www.oref.org.il/WarningMessages/alert/alerts.json`
- Railway worker keeps running as-is
- Relay provides Israel egress and returns upstream response

## Recommended Architecture

1. Deploy a tiny relay service in Israel (example region: Google Cloud Run `me-west1` / Tel Aviv)
2. Expose `GET /oref-alerts`
3. Relay fetches Oref and returns raw body + upstream status
4. Protect endpoint with a shared token
5. Point Supabase `sources.feed_url` for `home-front-command-alerts` to this relay URL

## Minimal Relay Requirements

- Validate token (query token or header token)
- Fetch with timeout (recommended `20s`)
- Send Accept/User-Agent headers
- Return upstream status/body directly
- Return `502` when upstream is unreachable
- Expose `GET /healthz` for simple health checks

## Supabase Update

After relay deployment, update source config:

```sql
update public.sources
set
  feed_url = 'https://<your-relay-domain>/oref-alerts?token=<RELAY_TOKEN>',
  is_active = true
where slug = 'home-front-command-alerts';
```

## Railway Alerts Worker (Loop Mode)

If running as a long-lived service, use:

```bash
sh -c 'INTERVAL=${ALERTS_INTERVAL_SECONDS:-20}; while true; do echo "[alerts] tick $(date -u +%FT%TZ)"; npm run worker:alerts || echo "[alerts] run failed"; sleep "$INTERVAL"; done'
```

Required env vars on `worker-alerts` service:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALERTS_INTERVAL_SECONDS=20`

## Verification Checklist

1. `GET /healthz` returns `200`
2. Relay `GET /oref-alerts` returns Oref payload (not `403`)
3. Railway logs no longer show `Official alerts request failed (403)`
4. Supabase `ingestion_runs` has successful `official_alerts` runs
5. `alerts` table receives inserts/updates

## Security Notes

- Keep token secret and rotate periodically
- Prefer header token over query token if possible
- Add minimal rate limiting and request logs

## Kamatera Quick-Launch Handoff (2026-03-13)

### Done in this session

1. Chose Kamatera for Israel relay (quickest-launch path).
2. Created Israeli server (minimum plan).
3. Fixed SSH private key permission issue:
   - Error: key file too open (`0644`)
   - Fix used: `chmod 600 private.txt`
4. Successfully connected to the server via SSH.

### Plan chosen

- Keep Railway `worker:alerts` running as-is.
- Deploy a small relay on Kamatera.
- Use query token for fastest launch:
  - `GET /oref-alerts?token=<RELAY_TOKEN>`
- Use no purchased domain for now:
  - `https://<SERVER_IP>.sslip.io`

### Execution checklist (completed 2026-03-13)

1. Installed Docker + Compose and enabled Docker service on the Kamatera host.
2. Created relay deployment at `/opt/oref-relay`.
3. Added relay app (`relay.mjs`) with:
   - `GET /healthz` -> `200 ok`
   - `GET /oref-alerts` -> token validation, 20s timeout fetch to Oref, pass upstream status/body, `502` on upstream failure
4. Added HTTPS reverse proxy via Caddy and started services with Docker Compose.
5. Verified relay endpoints over TLS:
   - `https://212.80.205.239.sslip.io/healthz` -> `200`
   - `https://212.80.205.239.sslip.io/oref-alerts?token=<RELAY_TOKEN>` -> `200` + Oref JSON payload
6. Cut over Supabase source URL:

```sql
update public.sources
set
  feed_url = 'https://212.80.205.239.sslip.io/oref-alerts?token=<RELAY_TOKEN>',
  is_active = true
where slug = 'home-front-command-alerts';
```

7. Verified end-to-end recovery:
   - Relay endpoint returns payload (no `403`)
   - Railway logs stop repeating `Official alerts request failed (403)` after cutover
   - Supabase `ingestion_runs` now shows successful `official_alerts` runs

### Remaining hardening after cutover

- Rotate relay token (token was used in terminal commands during setup)
- Keep periodic `/healthz` monitoring enabled
- Settle `ALERTS_INTERVAL_SECONDS` to a steady value (`15`-`20` seconds recommended for long-term)

### Rollback (if needed)

```sql
update public.sources
set
  feed_url = 'https://www.oref.org.il/WarningMessages/alert/alerts.json',
  is_active = true
where slug = 'home-front-command-alerts';
```
