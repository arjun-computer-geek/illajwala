# Design System Audit Plan – Phase 0

## Objectives
- Establish a repeatable process for consolidating UI components across patient, doctor, and admin applications.
- Identify priority components for migration into the shared `@illajwala/ui` package.
- Ensure accessibility, responsiveness, and branding consistency requirements are captured before implementation.

## Scope
- **Applications:** `patient-web`, `doctor-web`, `admin-console` (legacy React variants included for gap analysis).
- **Component Types:** Core primitives (buttons, inputs, select, typography), layout (navigation, cards), feedback (toasts, modals), data display (tables, charts).
- **Deliverables:** Component inventory spreadsheet, gap analysis report, migration backlog with owners.

## Audit Workflow
1. **Preparation**
   - Clone latest repositories; install dependencies for each app.
   - Export existing Tailwind/CSS tokens and global styles.
   - Set up shared Figma (or design tool) project to capture visual references.
2. **Inventory Capture**
   - Use the Component Catalog Template (below) to log each unique component.
   - Capture screenshots or component links; note variant states (hover, disabled, error).
   - Record accessibility attributes (ARIA, focus states, color contrast).
3. **Evaluation**
   - Compare props/interfaces across apps; highlight incompatible patterns.
   - Flag technical debt (inline styles, duplicated logic, missing tests).
   - Estimate effort to migrate each component (S, M, L).
4. **Prioritization**
   - Identify critical components used across multiple apps (e.g., primary button).
   - Align with product squads to confirm near-term feature dependencies.
   - Create migration roadmap for Phase 1–2 with target sprints.
5. **Sign-off**
   - Review findings with design/product; adjust brand tokens if required.
   - Publish summary in `docs/status/phase-0-weekly-<date>.md`.
   - File tickets in Linear/Jira with links to catalog entries.

## Component Catalog Template
| Component | App(s) Found In | Variants | Accessibility Notes | Dependencies | Migration Effort | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Button` | Patient, Doctor | Primary, Secondary, Icon | Meets WCAG contrast? | Tailwind plugin `ui/button` | M | TBD | Focus ring missing on Doctor app |
| `Input` | Patient, Admin | Text, Password | ARIA-invalid missing | Form libraries (react-hook-form) | S | TBD | Need shared validation messaging |
| ... | ... | ... | ... | ... | ... | ... | ... |

> Copy the table into a spreadsheet for easier filtering if needed.

## Checklists
- [ ] All apps audited for core component types.
- [ ] Accessibility notes validated with design team.
- [ ] Tokens (color, spacing, typography) documented and compared.
- [ ] Migration backlog created with prioritized order.
- [ ] Summary shared with stakeholders.

## Timeline
- **Week 0 (Day 1-2):** Preparation & inventory kickoff.
- **Week 0 (Day 3-4):** Evaluation & prioritization workshops.
- **Week 0 (Day 5):** Present findings, finalize migration plan.

## Risks & Mitigations
- **Incomplete coverage:** Assign component owners per app to ensure all modules reviewed.
- **Design divergence:** Conduct daily syncs with design lead during audit week.
- **Tooling gaps:** If Turborepo setup delays shared package work, document interim strategy (e.g., local npm link).

