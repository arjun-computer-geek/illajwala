# Ops & Notification Runbooks

## Consultation Realtime Outage

- **Symptoms**: SSE dashboards lose the `Live` badge, doctors stop receiving queue updates, admin metrics freeze.
- **Immediate checks**
  - Hit `identity-service/health` and `identity-service/metrics` to confirm uptime and review default Prometheus counters.
  - Inspect Redis availability; the realtime streams rely on the shared connection.
  - Review `consultation-events` queue depth on the messaging service via `/metrics`.
- **Mitigation**
  - Fail over to polling by toggling the `REALTIME_FALLBACK` feature flag in the config store.
  - Restart the identity service after clearing stalled event sources (`pm2 restart identity-service`).
  - If Redis is unhealthy, switch to the standby instance and update `REDIS_URL`.
- **Post-mortem tasks**
  - Export BullMQ job history for the affected window.
  - Attach the `/metrics` snapshot and Redis logs to the incident ticket.

## Notification Backlog / DLQ

- **Symptoms**: Admin console shows growing `queued` audit entries, DLQ gauge increases, resend jobs fail.
- **Immediate checks**
  - Review messaging service `/metrics` for `messaging_consultation_queue_depth` and failure counters.
  - Inspect `consultation-events-dlq` and `notification-resend` queues via BullMQ UI or `pnpm messaging queue:inspect`.
  - Confirm provider credentials (`SMTP_*`, `SMS_PROVIDER_*`, `WHATSAPP_*`) are valid in the environment.
- **Mitigation**
  - Replay DLQ jobs with `pnpm messaging queue:replay consultation-events-dlq`.
  - Temporarily switch SMS/WhatsApp templates to reduced volume mode by disabling respective preferences when advised by ops.
  - Use the admin resend composer to manually notify high-priority patients while automation recovers.
- **Post-mortem tasks**
  - Capture provider responses and attach to the incident record.
  - File follow-up issues for template adjustments or additional monitoring if failures persist.

## Analytics Drift

- **Symptoms**: Admin charts stop updating, `metrics.updated` SSE payloads send stale numbers, support raises data mismatch.
- **Immediate checks**
  - Trigger `/metrics` on identity service to ensure cron jobs are running.
  - Verify Mongo aggregation pipelines via `pnpm identity analytics:verify`.
- **Mitigation**
  - Run `pnpm identity analytics:rebuild` to regenerate rollups.
  - Switch dashboard cards to cached mode by enabling the `OPS_ANALYTICS_CACHE` flag.
- **Post-mortem tasks**
  - Document the discrepancy, including affected clinics and time window.
  - Schedule a data quality review with analytics owners.


