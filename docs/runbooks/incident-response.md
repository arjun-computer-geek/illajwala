# Incident Response Runbook

## Purpose
Provide a consistent, actionable process for detecting, triaging, and resolving production incidents impacting the Illajwala VisitNow platform.

## Owners
- **Primary:** Site Reliability Engineering (SRE) / Platform team.
- **Secondary:** On-call representatives from Patient Platform, Doctor Hub, Admin Console squads.
- **Escalation:** Head of Engineering, CTO, Compliance Officer (for regulated events).

## Prerequisites
- Access to observability stack (Grafana, Loki, Tempo), alerting tools (PagerDuty/Slack), infrastructure dashboard.
- Admin rights to cloud provider (AWS/GCP) and CI/CD pipelines.
- Updated contact list and escalation matrix stored in `docs/runbooks/contacts.md` (to be created).
- Incident tracking board (Jira/Linear) with incident project template.

## Severity Levels
- **SEV-0 (Critical):** Outage or data breach with regulatory impact.
- **SEV-1 (Major):** Core booking or consult workflow degraded for majority of users.
- **SEV-2 (Moderate):** Partial feature impact, performance degradation, or limited geography.
- **SEV-3 (Minor):** Cosmetic issues, single-customer impact, or mitigated alert.

## Procedure
1. **Detection**
   - Alert triggers via monitoring tools or user reports.
   - On-call acknowledges within 5 minutes (PagerDuty/Slack).
2. **Triage**
   - Assess severity using criteria above.
   - Create incident ticket with summary, start time, affected services.
   - Assign Incident Commander (IC) and Communications Lead (CL).
3. **Containment**
   - IC coordinates mitigation steps (e.g., feature flag off, rollback, scaling).
   - Capture all actions in incident ticket timeline.
4. **Communication**
   - CL posts updates in `#incident-war-room` Slack channel every 15 minutes for SEV-0/1.
   - Notify stakeholders (support, leadership) via predefined templates (see Appendix).
   - Update status page/ public communication if required.
5. **Resolution**
   - Confirm service restoration via monitoring and functional checks.
   - Document resolution time, root cause hypothesis, remaining risks.
6. **Post-Incident**
   - Schedule post-mortem within 48 hours for SEV-0/1, 5 business days for SEV-2.
   - Complete Incident Report (template below) and store in `docs/runbooks/incidents/<yyyy-mm-dd>-incident-<id>.md`.
   - Track action items with owners and due dates.

## Incident Report Template
```
# Incident <ID> – <Short Title>
- **Date:** YYYY-MM-DD
- **Severity:** SEV-0 | SEV-1 | SEV-2 | SEV-3
- **Services Impacted:** e.g., appointment-service, patient-web
- **Duration:** hh:mm
- **Summary:** One-paragraph overview of impact and resolution.
- **Timeline:** Bullet list with timestamps of key events/actions.
- **Root Cause:** Detailed analysis.
- **Detection:** How the incident was discovered; gaps to improve.
- **Resolution & Recovery:** Steps taken to restore service.
- **Preventive Actions:** Follow-up tasks with owners & deadlines.
- **Attachments:** Links to dashboards, logs, PRs, ADRs.
```

## Escalation Matrix (Draft)
- **T+0 min:** On-call engineer (SRE/Platform).
- **T+15 min:** Squad leads for impacted services.
- **T+30 min:** Head of Engineering.
- **T+60 min:** CTO, Compliance Officer (if user data affected).

## Communication Templates
- **Internal Slack Update (SEV-1):**  
  `Incident SEV-1 [<summary>] started at <time>. Impact: <description>. Mitigation in progress by <IC>. Next update in 15 min.`
- **Status Page (External):**  
  `We are currently investigating an issue affecting <service>. Users may experience <symptom>. Updates every 30 minutes.`

## Post-Incident Checklist
- [ ] Incident ticket updated with final resolution summary.
- [ ] Status page resolved and communication archived.
- [ ] Post-mortem scheduled and invite sent.
- [ ] Action items created in tracking tool with owners.
- [ ] Metrics updated (MTTR, incident count).

## References
- `docs/runbooks/release-train.md` (to be drafted) for deploy coordination.
- `MASTER-PRD.md` for affected domain context.

> Update this runbook quarterly or after any SEV-0 incident.

