# Zenos vs Medium Maker Pro Parity Execution Plan

Last updated: 2026-03-30
Owner: Product + Frontend + Backend + QA
Status: Phases 1-6 Complete (through GAP-024)

## 1. Goal
Bring Zenos frontend and product behavior to practical parity with Medium Maker Pro across:
- Cosmetic parity (layout quality, visual polish, component consistency)
- Functional parity (reader journey, writer journey, admin journey, monetization)
- Reliability parity (tests, instrumentation, observability)

This file is designed for iterative execution and progress tracking.

## 2. Baseline Scope Compared
Primary reference app:
- medium-maker-pro

Target app:
- zenos/zenos-frontend (plus backend dependencies where required)

High-signal source files reviewed:
- medium-maker-pro/src/App.tsx
- medium-maker-pro/src/pages/Article.tsx
- medium-maker-pro/src/pages/Write.tsx
- medium-maker-pro/src/pages/Pricing.tsx
- medium-maker-pro/src/pages/AdminDashboard.tsx
- medium-maker-pro/src/pages/SuperAdminDashboard.tsx
- medium-maker-pro/src/pages/AuthorAnalytics.tsx
- medium-maker-pro/src/pages/WorkflowView.tsx
- medium-maker-pro/src/components/*
- zenos/zenos-frontend/src/App.tsx
- zenos/zenos-frontend/src/pages/ArticlePage.tsx
- zenos/zenos-frontend/src/pages/WritePage.tsx
- zenos/zenos-frontend/src/pages/MembershipPage.tsx
- zenos/zenos-frontend/src/pages/AdminPage.tsx
- zenos/zenos-frontend/src/components/*

## 3. Parity Principles
1. Ship in thin vertical slices, not large rewrites.
2. Preserve current Zenos strengths (auth flow, route guards, typed hooks, richer API integration).
3. Prioritize user-visible parity first, then platform hardening.
4. Every phase must have measurable acceptance criteria.
5. No phase starts without clear dependency readiness.

## 4. Phase Roadmap

### Phase Completion Snapshot (Phases 1-6)
| Phase | Completion | Basis |
| --- | --- | --- |
| Phase 1 | Completed ✓ | GAP-007, GAP-008, GAP-009, GAP-010 are marked Completed ✓ |
| Phase 2 | Completed ✓ | GAP-011, GAP-012, GAP-013, GAP-014 are marked Completed ✓ |
| Phase 3 | Completed ✓ | GAP-015, GAP-016, GAP-017 are marked Completed ✓ |
| Phase 4 | Completed ✓ | GAP-018, GAP-019, and GAP-020 are marked Completed ✓ |
| Phase 5 | Completed ✓ | GAP-021 and GAP-022 are marked Completed ✓ |
| Phase 6 | Completed ✓ | GAP-023 and GAP-024 are marked Completed ✓ |

## Phase 0 - Visual and UX Baseline Parity (1-2 sprints)
Objective: Close obvious reader and navigation UX gaps with low-risk changes.

Deliverables:
- Promote search visibility in top nav and quick-access UX.
- Add article reading level and read-time visibility in card and article surfaces.
- Expand reading preferences controls to match expected comfort settings.
- Improve article TOC active-state behavior and reading progress feedback.
- Add explicit theme mode control in primary nav/settings.
- Add discovery sort controls (newest/trending/recommended) where missing.

Exit criteria:
- Core reader surfaces expose read-time and reading-level metadata.
- Search can be reached in one interaction from any primary route.
- Reading settings are usable and persistent.

## Phase 1 - Writer Metadata and Content Structure Parity (2-3 sprints) - Completed ✓
Objective: Make authoring workflow as expressive as prototype behavior.

Deliverables:
- Add writer-side reading-level selector if incomplete.
- Add series assignment and series navigation model (data + UI).
- Add cover upload UX parity (not URL-only flow) with preview and validation.
- Align write/publish success states with guided next actions.

Exit criteria:
- Writers can publish content with richer metadata in one flow.
- Reader can discover series context and navigate between series entries.

## Phase 2 - Reader Engagement and Social Depth Parity (2-3 sprints) - Completed ✓
Objective: Increase engagement depth and interaction clarity.

Deliverables:
- Complete reaction surface parity (including any missing reaction intents).
- Add/upgrade trending and related-content modules in article context.
- Upgrade comments for deeper discussion patterns and moderation hooks.
- Improve share UX consistency and visible social proof where appropriate.

Exit criteria:
- Article engagement controls are complete, coherent, and measurable.
- Discovery loops from article to article are visibly improved.

## Phase 3 - Monetization and Access Control Parity (3-4 sprints) - Completed ✓
Objective: Close the highest business-value functional gap.

Deliverables:
- Enforce premium gating on article reads where policy requires it.
- Add membership conversion modules in article context and pricing surfaces.
- Align membership page information architecture and plan comparison UX.
- Add premium read and conversion tracking events.

Exit criteria:
- Premium content access rules are correctly enforced.
- Conversion funnel is measurable end-to-end.

## Phase 4 - Admin, Workflow, and Analytics Parity (2-3 sprints) - Completed ✓
Objective: Match editorial and operational control depth.

Deliverables:
- Expand admin queue capabilities and bulk actions.
- Add moderation depth for comments and content states.
- Align writer analytics depth with prototype-level insights.
- Add workflow state visibility and progression tooling where missing.

Exit criteria:
- Admin operations can execute daily moderation/editorial tasks without manual workarounds.
- Author and admin analytics support practical decision making.

## Phase 5 - Design System Consolidation (2 sprints) - Completed ✓
Objective: Improve velocity and consistency by reducing bespoke UI drift.

Deliverables:
- Define canonical primitives set and map existing components.
- Close critical primitive gaps and standardize interactions.
- Normalize typography, spacing, and semantic color token use across pages.

Exit criteria:
- Major pages render with consistent interaction and spacing behavior.
- New feature work can use reusable primitives instead of one-off styles.

## Phase 6 - QA, E2E, and Observability Readiness (2-3 sprints, can overlap) - Completed ✓
Objective: Make parity sustainable and production-safe.

Deliverables:
- Expand critical-path E2E coverage (auth, read, write, publish, monetization, admin).
- Define release quality gates and non-regression checks.
- Add runtime error tracking and event instrumentation standards.
- Add dashboard-level KPIs for engagement and conversion health.

Exit criteria:
- Critical paths are protected by automated tests.
- Incidents are observable and triageable in production.

## 5. Master Gap Backlog (Cosmetic + Functional)

Legend:
- Type: C (Cosmetic), F (Functional), CF (Both)
- Size: S, M, L
- Priority: P0 (critical), P1 (high), P2 (medium)

| ID | Gap Item | Type | Priority | Size | Phase | Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | Search discoverability in global nav | C | P1 | S | 0 | none | Completed ✓ |
| GAP-002 | Read-time and reading-level badges consistency | CF | P1 | S | 0 | article metadata availability | Completed ✓ |
| GAP-003 | Reading preferences parity (font/width/line height) | CF | P1 | M | 0 | preference store alignment | Completed ✓ |
| GAP-004 | TOC active section and scroll feedback polish | C | P2 | S | 0 | article heading anchors | Completed ✓ |
| GAP-005 | Theme mode control parity | C | P2 | S | 0 | theme state wiring | Completed ✓ |
| GAP-006 | Explore/feed sort parity | CF | P1 | S | 0 | query params and API support | Completed ✓ |
| GAP-007 | Writer reading-level selector parity | F | P1 | S | 1 | schema field wiring | Completed ✓ |
| GAP-008 | Series model and UI parity | F | P1 | L | 1 | schema + APIs + UI | Completed ✓ |
| GAP-009 | Cover upload UX parity in write flow | CF | P1 | M | 1 | media upload endpoint | Completed ✓ |
| GAP-010 | Publish success and post-publish guidance parity | C | P2 | S | 1 | navigation outcomes | Completed ✓ |
| GAP-011 | Reaction intents completion and UX consistency | CF | P1 | M | 2 | reaction endpoint support | Completed ✓ |
| GAP-012 | Article-side trending/related module parity | C | P2 | M | 2 | ranking feed endpoint | Completed ✓ |
| GAP-013 | Comment depth and moderation hooks | F | P1 | M | 2 | comment policy endpoints | Completed ✓ |
| GAP-014 | Share proof and interaction feedback parity | C | P2 | S | 2 | share counters/events | Completed ✓ |
| GAP-015 | Premium paywall enforcement | F | P0 | L | 3 | membership entitlement checks | Completed ✓ |
| GAP-016 | Membership conversion UX parity | CF | P0 | M | 3 | plan and billing integration | Completed ✓ |
| GAP-017 | Premium funnel event instrumentation | F | P1 | M | 3 | analytics pipeline | Completed ✓ |
| GAP-018 | Admin queue and bulk operations parity | F | P1 | M | 4 | admin batch APIs | Completed ✓ |
| GAP-019 | Editorial workflow visibility parity | F | P1 | M | 4 | workflow state model | Completed ✓ |
| GAP-020 | Author/admin analytics depth parity | CF | P1 | M | 4 | metrics backend completeness | Completed ✓ |
| GAP-021 | Design primitive coverage parity | C | P2 | L | 5 | UI component standardization | Completed ✓ |
| GAP-022 | Typography and spacing token consistency | C | P2 | M | 5 | design token map | Completed ✓ |
| GAP-023 | Critical-path E2E parity coverage | F | P0 | L | 6 | stable test fixtures | Completed ✓ |
| GAP-024 | Production observability parity | F | P1 | M | 6 | error and event tooling | Completed ✓ |

## 6. Iteration Tracker
Use this block in every cycle. Duplicate one row per sprint/iteration.

| Iteration | Date Start | Date End | Phase Target | Planned GAP IDs | Completed GAP IDs | Carry-over GAP IDs | Outcome | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ITER-001 | 2026-03-30 | 2026-03-30 | Phase 0 | GAP-001, GAP-002, GAP-003, GAP-004, GAP-005, GAP-006 | GAP-001, GAP-002, GAP-003, GAP-004, GAP-005, GAP-006 | None | Phase 0 fully implemented. All reader UX parity gaps closed. | Copilot |
| ITER-002 | 2026-03-30 | 2026-03-30 | Phase 2 | GAP-011, GAP-012, GAP-013, GAP-014 | GAP-011, GAP-012, GAP-013, GAP-014 | None | Phase 2 fully implemented with E2E testing. Backend: 315 tests pass (76% coverage). Frontend: builds successfully, no npm vulnerabilities. All 4 engagement gaps closed. | Copilot |
| ITER-003 | 2026-03-30 | 2026-03-30 | Phase 3 | GAP-015, GAP-016, GAP-017 | GAP-015, GAP-016, GAP-017 | None | Phase 3 fully implemented. Premium paywall enforcement, membership conversion UI, and funnel tracking complete. Backend: 315/315 tests pass, 74% coverage, zero regression. Frontend: builds with no errors, zero npm vulnerabilities. All paywall logic backward compatible. Ready for Phase 4. | Copilot |
| ITER-004 | 2026-03-30 | 2026-03-30 | Phase 1 | GAP-007, GAP-008, GAP-009, GAP-010 | GAP-007, GAP-008, GAP-009, GAP-010 | None | Phase 1 fully implemented. Added SeriesPage and /series/:id route, publish-success guidance modal, backend series pagination contract fix (rows->items), and frontend series data contract alignment (rows->items). Validation: backend 394/394 passing with 78% coverage; targeted frontend Phase-1 suites 27/27 passing; frontend production build passing. | Copilot |
| ITER-005 | 2026-03-30 | 2026-03-30 | Phase 4 | GAP-018 | GAP-018 | GAP-019, GAP-020 | Phase 4 started with admin queue and bulk operations parity completed and stabilized. Frontend fixes included RelatedArticles null-safety and parity test updates for Admin/Article/Write flows. Validation: backend 394/394 passing with 78% coverage; frontend 254/254 passing with lint/build green and 69.87% statement coverage. Security: pnpm audit --prod reports zero known vulnerabilities in backend and frontend. | Copilot |
| ITER-006 | 2026-03-30 | 2026-03-30 | Phase 4 | GAP-019 | GAP-019 | GAP-020 | Implemented Medium Maker style editorial workflow visibility with a dedicated Workflow page (`/workflow`) including queue/list panel, workflow progression timeline, reviewer actions, and workflow message stream. Navigation parity added across desktop sidebar, mobile nav, and topbar menu. Validation: targeted workflow/navigation suites 10/10 passing; workflow page tests 2/2 passing; frontend production build passing. | Copilot |
| ITER-007 | 2026-03-30 | 2026-03-30 | Phase 4 | GAP-020 | GAP-020 | None | Implemented analytics-depth parity across author and admin surfaces using live production metrics. Author dashboard gained story diagnostics (views/reads/read-ratio/engagement-rate), audience health snapshot, and submission lifecycle aging insights. Admin dashboard gained governance efficiency KPIs (approval/rejection/publish efficiency, moderation pressure, queue pressure) plus risk watchlist ranking from dislikes/comments. Validation: full frontend gate passed via `./scripts/check-all.sh` (eslint, 256/256 tests, production build). | Copilot |
| ITER-008 | 2026-03-30 | 2026-03-30 | Phase 5 | GAP-021, GAP-022 | GAP-021, GAP-022 | None | Completed design-system consolidation slice with canonical primitives (`SurfaceCard`, `SectionHeader`, `MetricTile`) and migrated major analytics/workflow admin surfaces to standardized spacing, typography, and semantic token usage. Validation: full frontend gate passed via `./scripts/check-all.sh` (eslint, 256/256 tests, production build). | Copilot |
| ITER-009 | 2026-03-30 | 2026-03-30 | Phase 6 | GAP-023, GAP-024 | GAP-023, GAP-024 | None | Implemented critical-path E2E-style routing coverage (`tests/e2e/critical-path-routing.test.tsx`), added release quality gate workflow (`scripts/release-gate.sh`, `pnpm run check:release`), and wired runtime observability standards (`src/lib/observability.ts`, global error/unhandled rejection capture, page-view event instrumentation in app shell). Validation: release gate passed (lint, critical-path suite, full suite 262/262, production build, coverage snapshot). | Copilot |
| ITER-010 | 2026-03-30 | 2026-03-30 | Cross-phase parity polish | GAP-002, GAP-020 | GAP-002, GAP-020 | None | Implemented prototype-faithful guest landing refresh on pre-login `/` (hero + social proof + trending stories + feature/writer sections) and upgraded analytics/admin visualizations from pseudo bars to real chart rendering using Recharts (`BarChart`, `AreaChart`, `LineChart`) for Medium Maker-style graph parity. Validation: frontend lint passed; targeted parity suites green (`HomePage`, `StatsPage`, `AdminPage`) with all tests passing. | Copilot |
| ITER-011 | 2026-03-30 | 2026-03-30 | Landing parity correction | GAP-002 | GAP-002 | None | Corrected remaining pre-login landing parity drift reported in QA feedback: centered hero/alignment, reduced over-wide horizontal spacing, restored `View all stories` action, and added full Medium Maker-style section parity (`For Writers`, `What our community says`, `Ready to dive deeper?`) using live article-author data where available with graceful fallbacks. Validation: frontend lint passed and guest-home parity suite remains green. | Copilot |

## 7. Definition of Done (Per Gap Item)
A gap item is Completed only if all checks pass:
- Functional behavior verified by demo or acceptance test.
- Visual behavior verified on desktop and mobile.
- API contract and edge cases validated.
- Telemetry added for key user action when applicable.
- Regression test coverage updated where relevant.
- Documentation and tracker status updated in this file.

## 8. Execution Order Recommendation
Recommended first 3 iterations:
- Iteration 1: GAP-001, GAP-002, GAP-003
- Iteration 2: GAP-006, GAP-007, GAP-009
- Iteration 3: GAP-015, GAP-016 (begin with feature flags)

Rationale:
- Iteration 1 improves immediate reader usability quickly.
- Iteration 2 upgrades writer and discovery capability.
- Iteration 3 starts monetization closure early to de-risk business impact.

## 9. Risk Register
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Series and paywall require backend dependencies | Timeline slip | Split UI scaffolding and backend contract work in parallel |
| Design parity work can sprawl | Scope creep | Lock phase scope to backlog IDs only |
| Monetization changes can break reader UX | Conversion drop | Roll out behind flags and monitor funnel metrics |
| Missing E2E can hide regressions | Late-stage instability | Start smoke-path E2E before full suite |

## 10. Update Protocol
After each implementation cycle:
1. Update Status for each touched GAP ID.
2. Add one row to Iteration Tracker.
3. Move unfinished items to Carry-over.
4. Re-estimate size if complexity changed.
5. Refresh Last updated date.

---
This plan is intentionally execution-focused and can be applied incrementally without waiting for full-system rewrite.
