# Identity Provider Vendor Comparison

## Evaluation Criteria
- **Security & Compliance:** HIPAA/PDP compliance, MFA support, audit logs, SOC2/ISO certifications, data residency options.
- **Feature Set:** SSO protocols (OAuth2/OpenID Connect/SAML), passwordless, social login, adaptive MFA, user management APIs, RBAC granularity.
- **Scalability & Performance:** Supported MAU/DAU limits, rate limiting, latency SLAs, multi-region availability.
- **Integration Effort:** SDK availability, language/framework support, migration tooling, customization flexibility.
- **Operational Overhead:** Hosting/maintenance responsibility, update cadence, monitoring requirements.
- **Cost & Licensing:** Pricing tiers, overage handling, support plans, hidden costs (SMS/WhatsApp OTP).
- **Vendor Lock-in & Extensibility:** Data export, user portability, ability to self-host or switch providers.
- **Support & Community:** SLA for support tickets, documentation quality, ecosystem integrations.

## Vendor Matrix
| Criteria | Auth0 | AWS Cognito | Azure AD B2C | Keycloak (Self-hosted) | Supertokens (Hybrid) |
| --- | --- | --- | --- | --- | --- |
| Security/Compliance | HIPAA BAA, SOC2, ISO | HIPAA eligible, AWS shared responsibility | HIPAA eligible, enterprise compliance | Depends on self-hosted infra | SOC2 (cloud), self-host options |
| MFA & Advanced Auth | Adaptive MFA, passwordless | SMS/email MFA, limited adaptive | Conditional access policies | Requires custom config/plugins | Built-in passwordless, MFA via plugins |
| Integration Effort | Rich SDKs, rules engine | SDKs but customization via Lambda triggers | Tight integration with Azure ecosystem | Requires devops expertise, custom code | SDKs for JS/TS; need infra for core |
| Scalability | Global PoPs, high MAU tiers | Scales with AWS infra | Scales with Azure AD | Depends on cluster sizing | Cloud-managed core, scalable |
| Cost Model | Per MAU + add-ons | Usage-based (monthly active users) | Monthly active users, enterprise plans | Infra + ops costs | SaaS + infra for core modules |
| Operational Overhead | Low (managed) | Medium (Lambda triggers, config) | Medium (Azure management) | High (hosting, updates, security) | Medium (hybrid hosting) |
| Customization | High via actions/hooks | Moderate via triggers | Moderate via policies/custom UI | High (complete control) | High for auth flows, limited UI |
| Lock-in Risk | Moderate; proprietary rules | Moderate; AWS ecosystem | High; tied to Azure AD | Low; open-source | Low-medium; can self-host |
| Support | Enterprise SLAs, community | AWS support plans | Microsoft support tiers | Community support, paid consultants | Vendor support, OSS community |
| Notable Pros | Fastest time-to-market, rich ecosystem | Tight AWS integration, low cost at scale | Enterprise SSO compatibility | Full control, on-prem option | Modern dev-focused API, flexible |
| Notable Cons | Cost increases steeply, vendor lock-in | Complex config, limited UI flexibility | Requires Azure expertise, UX customization | Requires dedicated ops & security | Still maturing, fewer enterprise features |

## Recommendations Snapshot
- **Fastest path & enterprise-ready:** Auth0.
- **Cost-sensitive with AWS stack:** AWS Cognito.
- **Microsoft ecosystem alignment:** Azure AD B2C.
- **Full control / on-prem requirement:** Keycloak.
- **Developer-friendly hybrid:** Supertokens.

## Open Questions
- SMS/OTP delivery requirements and cost tolerance.
- Expected peak MAU/DAU numbers and growth trajectory.
- Need for B2B multi-tenant SSO (clinic admins using corporate identity).
- Data residency constraints for future markets.
- Internal expertise for managing self-hosted identity.

## Next Steps
- Gather hard cost quotations for projected MAU (12-month horizon).
- Run proof-of-concept for shortlisted vendors (Auth0 vs Cognito vs Keycloak).
- Document findings and update ADR if decision deviates from initial assumption.
- Align with security/compliance on audit trail requirements.

