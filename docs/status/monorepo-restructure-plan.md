# Shared Mongo Integration Plan

## Objectives
- Maintain existing git submodule structure for `illajwala-patient`, `illajwala-doctor`, and `illajwala-admin`.
- Introduce a shared MongoDB cluster that serves all products while respecting domain boundaries and permissions.
- Provide shared services/APIs that expose consolidated data to each application without enforcing a monorepo.

## Target Structure
```
illajwala/
├─ illajwala-patient/   (git submodule)
├─ illajwala-doctor/    (git submodule)
├─ illajwala-admin/     (git submodule)
├─ shared-services/
│  ├─ identity-service/
│  ├─ provider-service/
│  ├─ appointment-service/
│  ├─ payment-service/
│  └─ notification-service/
└─ docs/
```

## Phased Migration Plan

### Phase A – Data Blueprint (Week 0-1)
- [ ] Inventory existing schemas across patient, doctor backends (see `docs/status/current-schemas.md`).
- [ ] Define canonical collections (User, Provider, Clinic, Appointment, Payment, Review, Notification).
- [ ] Establish multi-app access controls (RBAC scopes, database user roles).
- [ ] Document target collection structures in `docs/status/mongo-data-model.md`.

### Phase B – Shared Cluster Provisioning (Week 1-2)
- [ ] Provision MongoDB Atlas project (staging + prod) with separate databases per domain.
- [ ] Configure database users/roles for each service (least privilege).
- [ ] Seed reference data (roles, specialties, taxonomy) via init scripts.
- [ ] Set up schema validation hooks (Mongoose, Atlas JSON validators) and CI checks.

### Phase C – Service Layer Integration (Week 2-3)
- [ ] Expose shared REST APIs for identity, provider, scheduling, messaging services.
- [ ] Update each app’s backend to consume shared services via SDK or HTTP client.
- [ ] Implement per-application scopes (admin vs doctor vs patient) in service authentication.
- [ ] Configure connection pooling and secrets management for shared Mongo URIs.

### Phase D – Infrastructure & Observability (Week 3-4)
- [ ] Enable MongoDB backups, point-in-time recovery, and alerting (Atlas).
- [ ] Configure monitoring (metrics, logs, trace) for shared services and cluster.
- [ ] Implement backup/restore drills and document runbooks.
- [ ] Document onboarding guide for new environments referencing shared cluster.

### Phase E – Governance & Scaling (Week 4+)
- [ ] Define SLA for shared services (uptime, response times).
- [ ] Establish change management for schema updates (migration review board).
- [ ] Create shared API contract documentation and versioning policy.
- [ ] Monitor query performance; optimize indexes and caching strategies.

## Risk Mitigation
- **Breaking schema changes:** Use versioned JSON schemas and feature flags; communicate freeze windows.
- **Performance bottlenecks:** Conduct load testing before consolidation; plan for sharding or read replicas if required.
- **Access control gaps:** Enforce role-based policies at service layer; audit database users regularly.
- **Operational overhead:** Automate backups/monitoring; provide runbooks for Mongo incidents.

## Communication Plan
- Weekly updates in `docs/status/weekly-report-YYYY-MM-DD.md`.
- Cross-team sync at start/end of each phase.
- Documentation of schema/service changes in `docs/changelog.md` and ADRs.

## Success Criteria
- Unified database serves all applications with documented schema.
- Shared services expose consistent APIs consumed by admin, doctor, and patient apps.
- Shared cluster connectivity and validation automated across environments.
- Observability dashboards established for Mongo performance and service health.

## Follow-up Actions
- Assign owners for each phase and create corresponding tickets.
- Schedule brown-bag session to review shared schema with all teams.
- Plan tabletop exercise for Mongo incident response once live.

