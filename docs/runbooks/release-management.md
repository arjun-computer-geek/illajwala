# Release Management Runbook

## Purpose
Standardize the process for planning, executing, and monitoring releases across patient, doctor, and admin applications, along with associated backend services.

## Owners
- **Release Manager (RM):** Rotating role from Platform team.
- **Squad Representatives:** Leads from Patient, Doctor, Admin, and Shared Services.
- **SRE/DevOps:** Oversees deployment tooling, rollback procedures.
- **QA Lead:** Coordinates testing sign-offs and regression coverage.

## Release Cadence
- **Regular Release Train:** Bi-weekly on Wednesdays (target window 10:00–12:00 IST).
- **Hotfix Window:** As needed, with RM approval and SRE standby.
- **Code Freeze:** Begins Monday 18:00 IST prior to release; exceptions require RM approval.

## Pre-Release Checklist (T-48h)
- [ ] All tickets tagged for release are merged and pass CI.
- [ ] Regression suite executed (unit, integration, E2E) with results logged.
- [ ] Release notes drafted in `docs/changelog.md` under new entry.
- [ ] Feature flags reviewed; default states documented.
- [ ] SRE verifies infrastructure changes (Terraform, database migrations).
- [ ] Rollback plan defined for each service/app change.
- [ ] Stakeholder communication drafted (internal announcement, support briefing).

## Pre-Release Meeting (T-24h)
- Review release scope, known risks, and pending approvals.
- Confirm on-call assignments for release window.
- Validate monitoring dashboards and alerts for new features.

## Deployment Steps (Release Day)
1. **Go/No-Go (09:30 IST)**
   - RM checks readiness with squad reps and SRE.
   - Sign-off recorded in release ticket.
2. **Backend Services**
   - Deploy to staging environment; run smoke tests.
   - Promote to production sequentially (identity → providers → appointments → payments → messaging → analytics).
   - Monitor metrics (latency, error rate) for 15 minutes per service before proceeding.
3. **Frontend Applications**
   - Trigger patient-web, doctor-web, admin-console builds (Vercel/Netlify or equivalent).
   - Validate canary deployments before full rollout (feature flags where applicable).
   - Clear CDN caches if necessary.
4. **Verification**
   - QA executes release smoke checklist (booking flow, login, dashboard load).
   - RM logs completion times and observations in release ticket.

## Post-Release Actions
- [ ] Update `docs/changelog.md` with final notes, including feature flags and known issues.
- [ ] Notify Support and Ops of release completion with summary.
- [ ] Monitor for 24 hours; log anomalies in release ticket.
- [ ] Schedule retrospective if critical issues occurred.

## Hotfix Procedure
- Obtain RM approval; create dedicated hotfix branch from production tag.
- Run targeted tests; document risk assessment.
- Deploy with SRE supervision; update changelog and incident ticket if applicable.
- Back-merge hotfix changes into main branch immediately after deployment.

## Rollback Procedure
- Identify scope of failure; decide on partial vs full rollback.
- For services: redeploy previous container version or revert migration.
- For frontends: re-deploy previous successful build or toggle feature flag.
- Document rollback steps in release ticket and incident report if triggered.

## Communication Templates
- **Pre-release heads-up (Slack/email):**  
  `Release <version> scheduled for <date/time>. Scope: <summary>. Code freeze starts <time>.`
- **Post-release announcement:**  
  `Release <version> completed at <time>. Key updates: <bullets>. Known issues: <links>.`
- **Hotfix notification:**  
  `Hotfix <ID> deploying now to address <issue>. Expect brief impact on <service>.`

## Metrics to Track
- Release frequency, change failure rate, mean time to restore (MTTR).
- Number of hotfixes per release.
- Deployment duration and manual intervention count.

## References
- `docs/runbooks/incident-response.md` for escalation & incident handling.
- `docs/status/phase-0-backlog.md` for environment setup tasks.
- Feature flag inventory (to be documented) for rollout strategies.

> Review and update this runbook each quarter or after any SEV-1 incident triggered by a release.

