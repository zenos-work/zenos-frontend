# Zenos Frontend — Pending Implementation Plan

**Date:** April 10, 2026
**Branch:** development
**Scope:** Backend API modules with no (or incomplete) frontend coverage, including Feature Flag consumer infrastructure and announcements
**Status:** In progress — Section 0, P1, and P2 complete; P3 newsletters/analytics tranche complete

---

## How to Use This Document

- Each item maps a backend API module to the required frontend work.
- Every feature gate is **controlled by a Feature Flag** via `useFeatureFlag(key)` — see [Section 0](#0-feature-flag-consumer-infrastructure--announcements) for the shared infrastructure that must be built first.
- Priority tiers: **P1 → Core creator/reader**, **P2 → Org/team**, **P3 → Platform differentiation**, **P4 → Enterprise/advanced**.
- Mark status as `[ ]` → `[~]` (in progress) → `[x]` (done) per item.

---

## 0. Feature Flag Consumer Infrastructure & Announcements

> **Must be built before any feature-gated work below. The admin-side CRUD and announcement preview already exist in `FeatureFlagsPanel.tsx` and `useAdmin.ts`. This section is the missing consumer side.**

### Section 0 Progress (Apr 10, 2026)

- `[x]` Created `src/hooks/useFeatureFlags.ts` with `useFeatureFlags()` and `useFeatureFlag(key)` using `GET /api/features` + normalized response mapping.
- `[x]` Added `src/components/ui/FeatureAnnouncementBanner.tsx` and wired it into `src/components/layout/AppShell.tsx`.
- `[x]` Added `src/components/ui/FeatureAnnouncement.tsx` (preview/render component scaffold for announcement payloads).
- `[x]` Added `src/components/ui/FeatureComingSoon.tsx` for gated fallback rendering.
- `[x]` Implemented AppShell announcement flow: compares prior feature state from localStorage, emits in-app toast, and shows dismissible banner for enabled/disabled transitions.
- `[x]` Added frontend tests for this slice:
	- `tests/hooks/useFeatureFlags.test.tsx`
	- `tests/components/layout/AppShell.test.tsx` (new announcement assertion)
- `[~]` Remaining in Section 0: wire `FeatureAnnouncement` preview payload UI into `FeatureFlagsPanel.tsx` preview modal.

### Validation Snapshot (Apr 10, 2026)

- Full coverage command executed: `npm run test:coverage`
- Result: `84/84` test files passed, `324/324` tests passed.
- Export-path regression follow-up completed:
	- PDF export now uses built-in PDF fonts in `src/lib/articlePdfDocument.tsx` for deterministic offline/test rendering.
	- `tests/lib/articleExport.test.ts` now validates the current blob-download flow rather than removed jsPDF internals.
- New Section 0 tests pass:
	- `tests/hooks/useFeatureFlags.test.tsx`
	- `tests/components/layout/AppShell.test.tsx`

### 0.1 — `useFeatureFlags` hook

**File:** `src/hooks/useFeatureFlags.ts` *(new)*
**Backend:** `GET /api/features` (all flags for current user/org), `GET /api/features/:key` (single flag evaluation)

```ts
// Shape (align with backend FeatureFlagAdmin type already in src/types)
export function useFeatureFlags()        // returns { flags: Record<string, boolean>, isLoading }
export function useFeatureFlag(key: string) // returns { enabled: boolean, isLoading }
```

**Implementation notes:**
- Query key: `['feature-flags', 'user']`
- Stale time: 5 minutes (flags don't change per-request; avoids waterfalls on every page render)
- Falls back to `false` on error (safe default = feature off)
- `useFeatureFlag(key)` is a derived selector on top of `useFeatureFlags` — no extra network call

**Usage pattern for every new feature below:**
```tsx
const { enabled } = useFeatureFlag('reading_lists')
if (!enabled) return <FeatureComingSoon name="Reading Lists" />
```

---

### 0.2 — `FeatureAnnouncement` component (banner + toast)

**Files:**
- `src/components/ui/FeatureAnnouncement.tsx` *(new)*
- `src/components/ui/FeatureAnnouncementBanner.tsx` *(new)*

**Backend:** `GET /api/features` returns each flag's `metadata` — includes `enabled_title`, `enabled_summary`, `disabled_title`, `disabled_summary`, `channels`, `effective_at`, `action_required`
The `usePreviewFeatureAnnouncement` mutation (already in `useAdmin.ts`) calls `POST /api/admin/feature-flags/preview-announcement`.

**What to build:**

| Component | Description |
|-----------|-------------|
| `FeatureAnnouncementBanner` | Full-width dismissible banner shown at top of AppShell when a flag transitions from disabled→enabled or enabled→disabled. Uses `metadata.enabled_title / disabled_title`. Shows `action_required` CTA if present. |
| `FeatureAnnouncement` (toast) | Toast variant (re-uses `useUiStore` toast) for in-app channel announcements. Triggered when `channels` includes `'in_app'`. |

**Integration points:**
- `AppShell.tsx`: Query `useFeatureFlags()` on mount, compare against previously seen flag states (persisted in `localStorage` keyed by `flag_key + version`). If a newly-enabled or newly-disabled flag has `channels` including `'in_app'`, render `<FeatureAnnouncementBanner>` or fire toast.
- `FeatureFlagsPanel.tsx` (already exists): The **Preview Announcement** button already calls `usePreviewFeatureAnnouncement` → render result into a `<FeatureAnnouncement>` preview modal (add this preview display to the existing panel).

**Dismissal logic:**
```ts
// Key: `zenos_feat_seen_${flag_key}_${effective_at}`
// Store in localStorage — banner hidden once user dismisses
```

---

### 0.3 — `FeatureComingSoon` component

**File:** `src/components/ui/FeatureComingSoon.tsx` *(new)*

Generic placeholder rendered when a feature flag is off in consumer context. Shows feature name + optional description. Used as fallback in all gated pages/sections below.

---

## P1 — Core Creator & Reader Features

### P1-1: Reading Lists

**Status:** `[x]`
**Feature flag key:** `reading_lists`
**Backend:** `GET/POST /api/reading-lists`, `GET/PUT/DELETE /api/reading-lists/:id`, `POST/DELETE /api/reading-lists/:id/articles/:article_id`

**Progress (Apr 10, 2026):**
- Implemented `src/hooks/useReadingLists.ts` query/mutation layer.
- Added `src/pages/ReadingListsPage.tsx` and routed `/reading-lists` in `src/App.tsx`.
- Added Reading Lists nav entry in `src/components/layout/Sidebar.tsx` behind `useFeatureFlag('reading_lists')`.
- Added article-card "Save to list" flow in `src/components/article/ArticleCard.tsx`.
- Added targeted tests: `tests/hooks/useReadingLists.test.tsx`, `tests/pages/ReadingListsPage.test.tsx`, updated `tests/components/article/ArticleCard*.test.tsx`, `tests/components/layout/Sidebar.test.tsx`, `tests/App.test.tsx`.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useReadingLists.ts` | **Create** | `useReadingLists()`, `useCreateReadingList()`, `useUpdateReadingList()`, `useDeleteReadingList()`, `useAddToReadingList()`, `useRemoveFromReadingList()` — all TanStack Query mutations/queries |
| `src/pages/ReadingListsPage.tsx` | **Create** | Full page: list of user's curated reading lists with article count + create/rename/delete. Click-through to list detail showing articles. Route: `/reading-lists` |
| `src/App.tsx` | **Modify** | Add `<Route path='/reading-lists' element={<ReadingListsPage />} />` inside ProtectedRoute + TermsRoute |
| `src/components/article/ArticleCard.tsx` | **Modify** | "Save to list" action in article 3-dot menu (if flag enabled) — opens a reading-list picker popover |
| `src/components/layout/AppShell.tsx` or Sidebar | **Modify** | Add "Reading Lists" nav link (if flag enabled) |

**Feature flag gate:** Wrap ReadingListsPage and "Save to list" button with `useFeatureFlag('reading_lists')`.

---

### P1-2: Article Revisions

**Status:** `[x]`
**Feature flag key:** `article_revisions`
**Backend:** `GET /api/articles/:id/revisions`, `GET /api/articles/:id/revisions/:version`

**Progress (Apr 10, 2026):**
- Added `src/hooks/useRevisions.ts`.
- Added `src/components/editor/RevisionHistoryPanel.tsx`.
- Wired revision-history access into `src/pages/WritePage.tsx` behind `useFeatureFlag('article_revisions')`.
- Added targeted coverage in `tests/hooks/useRevisions.test.tsx` and exercised the updated WritePage flow in `tests/pages/WritePage.test.tsx`.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useRevisions.ts` | **Create** | `useArticleRevisions(articleId)`, `useArticleRevision(articleId, version)` |
| `src/components/editor/RevisionHistoryPanel.tsx` | **Create** | Side panel in WritePage: lists version snapshots with timestamps + author. Clicking a version shows a diff view (before/after content). |
| `src/pages/WritePage.tsx` | **Modify** | Add "Revision History" toolbar button (if flag enabled) that opens `RevisionHistoryPanel` |

---

### P1-3: Schedule Publish

**Status:** `[x]`
**Feature flag key:** `schedule_publish`
**Backend:** Current `feature/r1` backend exposes scheduling through `POST /api/marketing/scheduled` rather than `POST /api/articles/:id/schedule`.

**Progress (Apr 10, 2026):**
- Added `useScheduleArticle()` in `src/hooks/useArticles.ts` mapped to the available marketing scheduling endpoint.
- Added schedule datetime input/action in `src/pages/WritePage.tsx` behind `schedule_publish || digital_marketing` feature evaluation.
- Updated `tests/hooks/useArticles.test.tsx` and `tests/pages/WritePage.test.tsx` to cover the expanded article hook surface.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useArticles.ts` | **Modify** | Add `useScheduleArticle()` mutation |
| `src/components/editor/PublishMenu.tsx` or WritePage toolbar | **Modify** | Add "Schedule" option alongside Publish button — opens datetime picker. On confirm, calls `useScheduleArticle`. Show scheduled badge in LibraryPage card. |

---

### P1-4: Duplicate Article

**Status:** `[x]`
**Feature flag key:** `article_duplicate`
**Backend:** `POST /api/articles/:id/duplicate`

**Progress (Apr 10, 2026):**
- Added frontend mutation scaffold in `src/hooks/useArticles.ts`.
- Added duplicate action in `src/pages/LibraryPage.tsx` behind the feature flag.
- Backend route implemented on `feature/r1` (`src/api/articles/handler.py` + service/repository updates), so this item is now complete.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useArticles.ts` | **Modify** | Add `useDuplicateArticle()` mutation (invalidates `articles/mine`) |
| `src/pages/LibraryPage.tsx` | **Modify** | Add "Duplicate" in article 3-dot menu (if flag enabled) |

---

### P1-5: Coauthors

**Status:** `[x]`
**Feature flag key:** `collaboration_coauthor`
**Backend:** `POST /api/articles/:id/coauthors` (body: `{ user_id }`)

**Progress (Apr 10, 2026):**
- Added `useAddCoauthor(articleId)` scaffold in `src/hooks/useArticles.ts`.
- Added `src/components/editor/CoauthorPicker.tsx` and gated it in `src/pages/WritePage.tsx` using the seeded `collaboration_coauthor` flag key.
- Backend route and persistence implemented on `feature/r1` (`article_coauthors` migration + article handler/service/repository updates), so this item is now complete.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useArticles.ts` | **Modify** | Add `useAddCoauthor(articleId)` mutation |
| `src/components/editor/CoauthorPicker.tsx` | **Create** | User search + invite for coauthor in WritePage settings sidebar. Only visible if `collaboration_coauthor` flag is enabled. |
| `src/pages/WritePage.tsx` | **Modify** | Render `<CoauthorPicker>` in article settings sidebar |

---

### P1-6: Earnings Dashboard

**Status:** `[x]`
**Feature flag key:** `earnings_dashboard`
**Backend:** `GET /api/earnings/me`, `GET /api/earnings/me/payouts`, `GET /api/earnings/me/breakdown`, `POST /api/tips/:article_id`, `GET /api/tips/me/received`, `POST /api/earnings/me/payouts/request`

> Note: `StatsPage.tsx` currently estimates earnings locally from article data. This replaces that with real API data.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useEarnings.ts` | **Create** | `useMyEarnings()`, `useMyPayouts()`, `useEarningsBreakdown(period)`, `useRequestPayout()`, `useSendTip(articleId)`, `useReceivedTips()` |
| `src/pages/EarningsPage.tsx` | **Create** | Full earnings dashboard: total earned, pending payout, monthly breakdown chart (replace StatsPage estimation), payout history table, request payout CTA. Route: `/earnings` |
| `src/App.tsx` | **Modify** | Add `<Route path='/earnings' element={<EarningsPage />} />` inside ProtectedRoute + TermsRoute |
| `src/pages/StatsPage.tsx` | **Modify** | Replace `estimateStoryEarnings()` mock with real `useEarningsBreakdown()` data when flag enabled |
| `src/components/article/ArticlePage.tsx` or footer | **Modify** | Add "Tip this writer" button (if `tips` sub-flag or same flag enabled) → opens tip amount modal |
| `src/components/layout/AppShell.tsx` or Sidebar | **Modify** | Add "Earnings" nav link (if flag enabled) |

---

### P1-7: Report Abuse / Content

**Status:** `[x]`
**Feature flag key:** `content_reports`
**Backend:** `POST /api/reports` (body: `{ article_id, reason, detail }`)

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useReports.ts` | **Create** | `useSubmitReport()` mutation |
| `src/components/article/ReportModal.tsx` | **Create** | Modal with reason selector + detail textarea. Triggered from ArticlePage 3-dot menu. |
| `src/pages/ArticlePage.tsx` | **Modify** | Add "Report" option in article actions menu (if flag enabled), renders `<ReportModal>` |

---

### P1-8: Notification Preferences

**Status:** `[x]`
**Feature flag key:** `notification_preferences`
**Backend:** `GET /api/notification-prefs`, `POST /api/notification-prefs`, `PUT /api/notification-prefs` (bulk), `GET/POST/DELETE /api/notification-prefs/push`

> The ProfilePage Settings > Notifications tab exists but shows a placeholder. This wires it to real data.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useNotificationPrefs.ts` | **Create** | `useNotificationPrefs()`, `useUpsertNotificationPref()`, `useBulkUpsertNotificationPrefs()`, `usePushSubscriptions()`, `useRegisterPushSub()`, `useUnregisterPushSub()` |
| `src/components/profile/NotificationPrefsPanel.tsx` | **Create** | Per-channel toggles (in_app, email, push) for each notification type: new_follower, comment_reply, article_published, etc. |
| `src/pages/ProfilePage.tsx` | **Modify** | Replace placeholder in `activeTab === 'notifications'` with `<NotificationPrefsPanel>` (if flag enabled) |

---

### P1-9: GDPR / Account Data & Erasure

**Status:** `[x]`
**Feature flag key:** `gdpr_controls`
**Backend:** `POST /api/users/me/data-export`, `GET /api/users/me/data-export/:id`, `POST /api/users/me/erase`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCompliance.ts` | **Create** | `useRequestDataExport()`, `useDataExportStatus(id)`, `useRequestAccountErasure()` |
| `src/components/profile/AccountDataPanel.tsx` | **Create** | "Download my data" button + status polling if export pending. "Delete account" with confirmation modal and 30-day cooling-off notice. |
| `src/pages/ProfilePage.tsx` | **Modify** | Add `AccountDataPanel` inside `activeTab === 'account'` section (if flag enabled) |

---

### P1-10: Session Management

**Status:** `[x]`
**Feature flag key:** `session_management`
**Backend:** `GET /api/users/me/sessions`, `DELETE /api/users/me/sessions/:id`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useSessions.ts` | **Create** | `useMyActiveSessions()`, `useRevokeSession()` |
| `src/components/profile/ActiveSessionsPanel.tsx` | **Create** | List of active devices/sessions with IP, browser, last seen. "Revoke" button per session. |
| `src/pages/ProfilePage.tsx` | **Modify** | Add `<ActiveSessionsPanel>` inside `activeTab === 'account'` section (if flag enabled) |

---

### P1-11: Block & Mute Users

**Status:** `[x]`
**Feature flag key:** `block_mute`
**Backend:** `GET/POST/DELETE /api/users/me/blocks`, `GET/POST/DELETE /api/users/me/mutes`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useBlockMute.ts` | **Create** | `useBlockedUsers()`, `useBlockUser()`, `useUnblockUser()`, `useMutedUsers()`, `useMuteUser()`, `useUnmuteUser()` |
| `src/components/profile/BlockMutePanel.tsx` | **Create** | Two lists (blocked / muted) with unblock/unmute actions |
| `src/pages/ProfilePage.tsx` | **Modify** | Add `<BlockMutePanel>` in account settings tab |
| `src/pages/ProfilePage.tsx` (other user view) | **Modify** | Add Block / Mute buttons in profile action bar (if flag enabled) |

---

## P2 — Organization & Team Features

### P2-1: Organizations — Dashboard

**Status:** `[x]`
**Feature flag key:** `organizations`
**Backend:** `GET/POST /api/organizations`, `GET/POST/PUT/DELETE /api/organizations/:id/members`, `GET/POST/PUT/DELETE /api/organizations/:id/teams`, team members CRUD, invitations CRUD, `POST /api/invitations/:token`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrg.ts` | **Create** | `useMyOrgs()`, `useCreateOrg()`, `useOrgMembers(id)`, `useAddMember()`, `useUpdateMemberRole()`, `useRemoveMember()`, `useOrgTeams(id)`, `useCreateTeam()`, `useUpdateTeam()`, `useDeleteTeam()`, `useTeamMembers()`, `useOrgInvitations(id)`, `useSendInvitation()`, `useRevokeInvitation()`, `useAcceptInvitation()` |
| `src/pages/OrgPage.tsx` | **Create** | Org dashboard with tabs: Overview, Members, Teams, Invitations. Route: `/org/:id` |
| `src/pages/OrgSettingsPage.tsx` | **Create** | Org settings shell with sub-tabs (General, API Keys, Audit Log, SSO, Subdomain, Vault, Add-ons, Usage). Route: `/org/:id/settings` |
| `src/App.tsx` | **Modify** | Add `/org/:id` and `/org/:id/settings` routes inside ProtectedRoute |
| `src/components/layout/AppShell.tsx` | **Modify** | Add Org switcher / link if user belongs to orgs (if flag enabled) |

---

### P2-2: Org API Keys

**Status:** `[x]`
**Feature flag key:** `org_api_keys`
**Backend:** `GET/POST/DELETE /api/organizations/:id/api-keys`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrgInfra.ts` | **Create** | `useOrgApiKeys(orgId)`, `useCreateApiKey()`, `useRevokeApiKey()` (also covers audit log + SSO config hooks) |
| `src/components/org/ApiKeysPanel.tsx` | **Create** | List keys with creation date, prefix, scope. Create + revoke. Show secret only once on creation. |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Render `<ApiKeysPanel>` in Developer tab (if flag enabled) |

---

### P2-3: Org Audit Log

**Status:** `[x]`
**Feature flag key:** `audit_log`
**Backend:** `GET /api/organizations/:id/audit-log`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrgInfra.ts` | **Modify** | Add `useOrgAuditLog(orgId, page)` |
| `src/components/org/AuditLogPanel.tsx` | **Create** | Paginated event log table: actor, action, resource, timestamp |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Render `<AuditLogPanel>` in Audit Log tab (if flag enabled) |

---

### P2-4: Custom Domains

**Status:** `[x]`
**Feature flag key:** `custom_domains`
**Backend:** `GET/POST/DELETE /api/domains`, `POST /api/domains/:id/verify`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useDomains.ts` | **Create** | `useMyDomains()`, `useAddDomain()`, `useDeleteDomain()`, `useVerifyDomain()` |
| `src/components/profile/CustomDomainPanel.tsx` | **Create** | Add/remove domain, show verification status, CNAME instructions |
| `src/pages/ProfilePage.tsx` | **Modify** | Add `<CustomDomainPanel>` in account/settings tab (if flag enabled) |

---

### P2-5: Org Subdomain

**Status:** `[x]`
**Feature flag key:** `org_subdomain`
**Backend:** `GET/PUT/DELETE /api/organizations/:id/subdomain`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrgInfra.ts` | **Modify** | Add `useOrgSubdomain(orgId)`, `useUpdateSubdomain()`, `useDeactivateSubdomain()` |
| `src/components/org/SubdomainPanel.tsx` | **Create** | Show current subdomain, update slug, deactivate |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Render `<SubdomainPanel>` in General tab (if flag enabled) |

---

### P2-6: SSO Configuration

**Status:** `[x]`
**Feature flag key:** `sso`
**Backend:** `GET/POST/PUT /api/organizations/:id/sso/configs` (SAML + OIDC)

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrgInfra.ts` | **Modify** | Add `useOrgSsoConfigs(orgId)`, `useCreateSsoConfig()`, `useUpdateSsoConfig()` |
| `src/components/org/SsoConfigPanel.tsx` | **Create** | SAML metadata URL display, entity ID, ACS URL, IdP config form; OIDC config form |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Render `<SsoConfigPanel>` in SSO tab (if flag enabled, enterprise tier only) |

---

## P3 — Platform Differentiation Features

### P3-1: Newsletters

**Status:** `[x]`
**Feature flag key:** `newsletters`
**Backend:** Full CRUD `/api/newsletters`, `/subscribers`, `/issues`, `/issues/:id/articles`, `/send-events`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useNewsletters.ts` | **Create** | `useMyNewsletters()`, `useCreateNewsletter()`, `useUpdateNewsletter()`, `useDeleteNewsletter()`, `useNewsletterSubscribers(id)`, `useAddSubscriber()`, `useUpdateSubscriberStatus()`, `useRemoveSubscriber()`, `useNewsletterIssues(id)`, `useCreateIssue()`, `useUpdateIssue()`, `useDeleteIssue()`, `useIssueArticles(id, issueId)`, `useAddArticleToIssue()`, `useRemoveArticleFromIssue()` |
| `src/pages/NewsletterPage.tsx` | **Create** | Creator-facing newsletter management: create newsletters, manage subscribers list, compose and send issues. Route: `/newsletters` |
| `src/App.tsx` | **Modify** | Add `/newsletters` route inside ProtectedRoute + TermsRoute |
| `src/components/layout/Sidebar.tsx` | **Modify** | Add "Newsletters" nav link for authors (if flag enabled) |

---

### P3-2: Analytics Dashboard (real data)

**Status:** `[x]`
**Feature flag key:** `analytics_dashboard`
**Backend:** `GET /api/analytics/dashboard/events`, `/conversions`, `/experiments`; `GET/POST /api/analytics/goals`, `/conversions`; `GET/POST /api/analytics/experiments`

> `StatsPage.tsx` currently derives all data locally from article lists. This adds a real analytics tab backed by the API.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAnalytics.ts` | **Create** | `useAnalyticsDashboard(dateRange)`, `useAnalyticsConversions(dateRange)`, `useAnalyticsExperiments()`, `useAnalyticsGoals()`, `useCreateGoal()`, `useAnalyticsEvents(params)` |
| `src/pages/StatsPage.tsx` | **Modify** | Add "Analytics" tab (alongside existing overview/stories/audience/business tabs). When flag enabled, wire `useAnalyticsDashboard` to replace static mock charts with real event data. |

---

### P3-3: Workflow Builder (visual)

**Status:** `[x]`
**Feature flag key:** `workflow_builder`
**Backend:** `GET /api/workflow-node-types`, `GET /api/workflow-templates`, `POST /:id/clone`, `GET/POST /api/workflows`, `GET/PUT/DELETE /api/workflows/:id`, `POST /api/workflows/:id/runs`, `GET /api/workflow-tasks`, `PUT /api/workflow-tasks/:id`, `GET/PUT /api/workflow-approvals/:id`, `POST /api/webhooks/workflow/:id`

> `WorkflowPage.tsx` currently only shows the editorial approval queue (Submit → Approve → Publish pipeline). The backend has a full general-purpose workflow engine.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useWorkflows.ts` | **Create** | `useWorkflowNodeTypes()`, `useWorkflowTemplates()`, `useCloneTemplate()`, `useMyWorkflows()`, `useCreateWorkflow()`, `useUpdateWorkflow()`, `useDeleteWorkflow()`, `useTriggerWorkflow()`, `useWorkflowRuns(id)`, `useMyWorkflowTasks()`, `useStartTask()`, `useCompleteTask()`, `useMyWorkflowApprovals()`, `useSubmitApproval()` |
| `src/components/workflow/WorkflowBuilder.tsx` | **Create** | Drag-and-drop node canvas (use a library like `@xyflow/react` / React Flow). Node palette from `useWorkflowNodeTypes`. Save/trigger workflow. |
| `src/components/workflow/WorkflowTemplateGallery.tsx` | **Create** | Browsable grid of templates with clone action |
| `src/components/workflow/WorkflowTaskInbox.tsx` | **Create** | Human-in-the-loop task list: claim task, submit decision |
| `src/pages/WorkflowPage.tsx` | **Modify** | Add tabs: "Approval Queue" (existing), "My Workflows" (builder list), "Templates", "Task Inbox" — gated by `workflow_builder` flag |

---

### P3-4: Courses

**Status:** `[x]`
**Feature flag key:** `courses`
**Backend:** Full CRUD `/api/courses`, modules, lessons, quizzes, questions

**Progress (Apr 11, 2026):**
- Added `src/hooks/useCourses.ts` for courses/modules/lessons/enrollment/progress lifecycle.
- Added `src/pages/CoursesPage.tsx`, `src/pages/CoursePage.tsx`, and `src/pages/CourseBuilderPage.tsx`.
- Added routes in `src/App.tsx` for `/courses`, `/courses/:id`, `/courses/new`, `/courses/:id/edit` with guard parity.
- Added targeted coverage in `tests/hooks/useCourses.test.tsx` and `tests/pages/CoursesPage.test.tsx`.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCourses.ts` | **Create** | `useCourses()`, `useCourse(id)`, `useCreateCourse()`, `useUpdateCourse()`, `useDeleteCourse()`, `useCourseModules(id)`, `useCreateModule()`, `useUpdateModule()`, `useDeleteModule()`, `useModuleLessons()`, `useCreateLesson()`, `useUpdateLesson()`, `useDeleteLesson()`, `useLessonQuiz()`, `useCreateQuiz()`, `useQuizQuestions()`, `useCreateQuestion()`, `useUpdateQuestion()`, `useDeleteQuestion()` |
| `src/pages/CoursesPage.tsx` | **Create** | Browse available courses (reader view). Route: `/courses` |
| `src/pages/CourseBuilderPage.tsx` | **Create** | Creator tool: build course → modules → lessons → quiz. Route: `/courses/new`, `/courses/:id/edit` |
| `src/pages/CoursePage.tsx` | **Create** | Learner view: progress through lessons, take quiz. Route: `/courses/:id` |
| `src/App.tsx` | **Modify** | Add course routes |

---

### P3-5: Community Spaces

**Status:** `[x]`
**Feature flag key:** `community`
**Backend:** Full CRUD `/api/community`, members, posts, replies, post likes

**Progress (Apr 11, 2026):**
- Added `src/hooks/useCommunity.ts` for spaces/members/posts/replies/likes.
- Added `src/pages/CommunityPage.tsx` and `src/pages/SpacePage.tsx`.
- Added routes in `src/App.tsx` for `/community` and `/community/:id` behind auth guard.
- Added targeted coverage in `tests/hooks/useCommunity.test.tsx` and `tests/pages/CommunityPage.test.tsx`.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCommunity.ts` | **Create** | `useCommunitySpaces()`, `useCommunitySpace(id)`, `useCreateSpace()`, `useUpdateSpace()`, `useDeleteSpace()`, `useJoinSpace()`, `useLeaveSpace()`, `useSpacePosts(id)`, `useCreatePost()`, `useUpdatePost()`, `useDeletePost()`, `usePostReplies()`, `useLikePost()` |
| `src/pages/CommunityPage.tsx` | **Create** | List of spaces, join/leave, view space posts, create posts, threaded replies. Route: `/community` |
| `src/pages/SpacePage.tsx` | **Create** | Individual space view. Route: `/community/:id` |
| `src/App.tsx` | **Modify** | Add community routes |

---

### P3-6: Connectors

**Status:** `[x]`
**Feature flag key:** `connectors`
**Backend:** `GET /api/connector-marketplace`, `GET/POST/DELETE /api/connectors/installs`, `GET/POST /api/connectors/mcp-servers`, `GET/POST /api/connectors/definitions`

**Progress (Apr 11, 2026):**
- Added `src/hooks/useConnectors.ts` for marketplace listings, installs, MCP servers, and definitions.
- Added `src/components/org/ConnectorsPanel.tsx` and integrated Connectors tab into `src/pages/OrgSettingsPage.tsx` behind `connectors` flag.
- Added targeted coverage in `tests/hooks/useConnectors.test.tsx`, `tests/components/org/ConnectorsPanel.test.tsx`, and updated `tests/pages/OrgSettingsPage.test.tsx`.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useConnectors.ts` | **Create** | `useConnectorMarketplace()`, `useMyConnectorInstalls(orgId)`, `useInstallConnector()`, `useUninstallConnector()`, `useMcpServers(orgId)`, `useCreateMcpServer()`, `useConnectorDefinitions()` |
| `src/components/org/ConnectorsPanel.tsx` | **Create** | Marketplace browser + installed connectors list + MCP server registry |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Add "Connectors" tab rendering `<ConnectorsPanel>` (if flag enabled) |

---

### P3-7: Marketplace

**Status:** `[x]`
**Feature flag key:** `marketplace`
**Backend:** `GET/POST /api/marketplace`, `PUT/DELETE /api/marketplace/:id`, `POST /:id/publish`, `GET/POST /:id/purchases`, `GET/POST /:id/reviews`, `GET /api/marketplace/my-purchases`

**Progress (Apr 11, 2026):**
- Added `src/hooks/useMarketplace.ts` for listing/detail/purchase/review workflows.
- Added `src/pages/MarketplacePage.tsx` and `src/pages/MarketplaceItemPage.tsx` with feature-flag fallback.
- Added routes in `src/App.tsx` for `/marketplace` and `/marketplace/:id`.
- Added targeted coverage in `tests/hooks/useMarketplace.test.tsx` and `tests/pages/MarketplacePage.test.tsx`.

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useMarketplace.ts` | **Create** | `useMarketplaceItems()`, `useMarketplaceItem(id)`, `useCreateMarketplaceItem()`, `usePublishItem()`, `usePurchaseItem()`, `useMyPurchases()`, `useItemReviews(id)`, `useWriteReview()`, `useDeleteReview()` |
| `src/pages/MarketplacePage.tsx` | **Create** | Browse templates/tools, buy, review. Route: `/marketplace` |
| `src/pages/MarketplaceItemPage.tsx` | **Create** | Item detail with buy button and reviews. Route: `/marketplace/:id` |
| `src/App.tsx` | **Modify** | Add marketplace routes |

---

## P4 — Enterprise & Advanced Features

**Progress (Apr 11, 2026):**
- Completed P4-1 through P4-11 across backend, frontend, DB, and jobs wiring.
- Added backend regression coverage for P4 feature-gate enforcement and SUPERADMIN-only admin extensions.
- Admin extensions (`admin_earnings`, `admin_billing`, `admin_compliance`) are guarded by both role checks and feature flags.

### P4-1: Podcasts

**Status:** `[x]`
**Feature flag key:** `podcasts`
**Backend:** Full CRUD `/api/podcasts`, episodes

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePodcasts.ts` | **Create** | `usePodcasts()`, `usePodcast(id)`, `useCreatePodcast()`, `useUpdatePodcast()`, `useDeletePodcast()`, `usePodcastEpisodes(id)`, `useCreateEpisode()`, `useUpdateEpisode()`, `useDeleteEpisode()` |
| `src/pages/PodcastsPage.tsx` | **Create** | Browse podcast shows. Route: `/podcasts` |
| `src/pages/PodcastBuilderPage.tsx` | **Create** | Creator: manage show + episodes (upload audio URL, transcript, duration). Route: `/podcasts/manage` |

---

### P4-2: Publications

**Status:** `[x]`
**Feature flag key:** `publications`
**Backend:** `/api/publications/subscriptions`, `/issues`, `/issues/:id/items`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePublications.ts` | **Create** | Subscriptions, issues, items CRUD hooks |
| `src/pages/PublicationsPage.tsx` | **Create** | Curated publication packages. Route: `/publications` |

---

### P4-3: Marketing Channels + A/B Tests

**Status:** `[x]`
**Feature flag key:** `marketing_tools`
**Backend:** `GET/POST/PUT/DELETE /api/marketing/channels`, `/scheduled`, `/ab-tests`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useMarketing.ts` | **Create** | Channels, scheduled publications, A/B test CRUD hooks |
| `src/pages/MarketingPage.tsx` | **Create** | Multi-channel distribution setup, scheduled publish calendar, A/B test manager. Route: `/marketing` |

---

### P4-4: Leads & CRM

**Status:** `[x]`
**Feature flag key:** `leads`
**Backend:** `GET/POST/PUT/DELETE /api/leads/forms`, `/score-rules`, `/contacts`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useLeads.ts` | **Create** | Forms, scoring rules, contacts CRUD hooks |
| `src/pages/LeadsPage.tsx` | **Create** | Lead forms builder, scoring rules, contact CRM view. Route: `/leads` |

---

### P4-5: Referrals

**Status:** `[x]`
**Feature flag key:** `referrals`
**Backend:** `GET/POST /api/referrals`, `POST /api/referrals/track`, `GET /api/referrals/events`, `/stats`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useReferrals.ts` | **Create** | `useReferralCode()`, `useGenerateCode()`, `useTrackReferral()`, `useReferralStats()` |
| `src/components/profile/ReferralWidget.tsx` | **Create** | Show referral code + shareable link, stats (clicks, signups). |
| `src/pages/ProfilePage.tsx` | **Modify** | Add referral widget in profile or account tab (if flag enabled) |

---

### P4-6: Usage Alerts & Quota

**Status:** `[x]`
**Feature flag key:** `usage_alerts`
**Backend:** `GET /api/usage/quota`, `GET /api/usage/export`, `GET/POST/PUT/DELETE /api/usage/alerts/:id`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useUsage.ts` | **Create** | `useOrgQuota()`, `useUsageExport()`, `useUsageAlerts(orgId)`, `useCreateAlertRule()`, `useUpdateAlertRule()`, `useDeleteAlertRule()`, `useToggleAlertRule()` |
| `src/components/org/UsagePanel.tsx` | **Create** | Quota gauge, usage export download button, alert rules CRUD |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Render `<UsagePanel>` in Usage tab (if flag enabled) |

---

### P4-7: Secrets Vault

**Status:** `[x]`
**Feature flag key:** `vault`
**Backend:** `GET/POST/DELETE /api/organizations/:id/vault/secrets`, rotate, test

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrgInfra.ts` | **Modify** | Add `useVaultSecrets(orgId)`, `useStoreSecret()`, `useRevokeSecret()`, `useRotateSecret()`, `useTestSecret()` |
| `src/components/org/VaultPanel.tsx` | **Create** | List secrets (name + created date, value hidden), store/revoke/rotate/test actions |
| `src/pages/OrgSettingsPage.tsx` | **Modify** | Render `<VaultPanel>` in Secrets Vault tab (if flag enabled) |

---

### P4-8: Workflow Costs

**Status:** `[x]`
**Feature flag key:** `workflow_costs`
**Backend:** `GET/POST/PUT/DELETE /api/workflow-costs/rates`, `/runs/:run_id`, `/workflows/:wid`, `/summaries`, `/monthly`, budget cap

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useWorkflowCosts.ts` | **Create** | Cost rates CRUD, run cost, workflow history, monthly rollup, budget cap hooks |
| `src/components/workflow/WorkflowCostPanel.tsx` | **Create** | Cost breakdown per run, monthly chart, budget cap setting |
| `src/pages/WorkflowPage.tsx` | **Modify** | Add "Costs" tab rendering `<WorkflowCostPanel>` (if flag enabled) |

---

### P4-9: Admin — Earnings Calculation

**Status:** `[x]`
**Feature flag key:** `admin_earnings`
**Backend:** `POST /api/admin/earnings/calculate`, `GET /api/admin/earnings/period/:period_start`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAdmin.ts` | **Modify** | Add `useAdminEarningsCalculate()`, `useAdminEarningsPeriod(period)` |
| `src/pages/AdminPage.tsx` | **Modify** | Add Earnings admin section: trigger monthly calculation, view period distribution report (if flag enabled) |

---

### P4-10: Admin — Billing Reconciliation

**Status:** `[x]`
**Feature flag key:** `admin_billing`
**Backend:** `GET /api/admin/billing/reconciliation/:period`, `POST /api/admin/billing/reconcile`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAdmin.ts` | **Modify** | Add `useAdminBillingReconciliation(period)`, `useAdminRunReconciliation()` |
| `src/pages/AdminPage.tsx` | **Modify** | Add Billing admin section (if flag enabled) |

---

### P4-11: Admin — Compliance / Erasure Queue

**Status:** `[x]`
**Feature flag key:** `admin_compliance`
**Backend:** `GET /api/admin/compliance/erasure-queue`, `POST /api/admin/compliance/erasure/:id/execute`

**Files to create / modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAdmin.ts` | **Modify** | Add `useErasureQueue()`, `useExecuteErasure()` |
| `src/pages/AdminPage.tsx` | **Modify** | Add Compliance section: pending erasure requests list with execute action (if flag enabled, SUPERADMIN only) |

---

## Routing Summary — New Routes

| Route | Page | Guard | Flag |
|-------|------|-------|------|
| `/reading-lists` | `ReadingListsPage` | ProtectedRoute + TermsRoute | `reading_lists` |
| `/earnings` | `EarningsPage` | ProtectedRoute + TermsRoute | `earnings_dashboard` |
| `/org/:id` | `OrgPage` | ProtectedRoute | `organizations` |
| `/org/:id/settings` | `OrgSettingsPage` | ProtectedRoute | `organizations` |
| `/newsletters` | `NewsletterPage` | ProtectedRoute + TermsRoute | `newsletters` |
| `/community` | `CommunityPage` | ProtectedRoute | `community` |
| `/community/:id` | `SpacePage` | ProtectedRoute | `community` |
| `/courses` | `CoursesPage` | AppShell (public) | `courses` |
| `/courses/:id` | `CoursePage` | AppShell (public) | `courses` |
| `/courses/new` | `CourseBuilderPage` | ProtectedRoute + TermsRoute | `courses` |
| `/courses/:id/edit` | `CourseBuilderPage` | ProtectedRoute + TermsRoute | `courses` |
| `/marketplace` | `MarketplacePage` | AppShell (public) | `marketplace` |
| `/marketplace/:id` | `MarketplaceItemPage` | AppShell (public) | `marketplace` |
| `/podcasts` | `PodcastsPage` | AppShell (public) | `podcasts` |
| `/podcasts/manage` | `PodcastBuilderPage` | ProtectedRoute + TermsRoute | `podcasts` |
| `/publications` | `PublicationsPage` | ProtectedRoute | `publications` |
| `/marketing` | `MarketingPage` | ProtectedRoute + TermsRoute | `marketing_tools` |
| `/leads` | `LeadsPage` | ProtectedRoute + TermsRoute | `leads` |

---

## Feature Flag Keys Reference

All flag keys below must be created via `AdminPage → Feature Flags` panel before the corresponding frontend UI becomes visible.

| Flag Key | Controls |
|----------|---------|
| `reading_lists` | Reading Lists page + "Save to list" in article menus |
| `article_revisions` | Revision History panel in WritePage |
| `schedule_publish` | Schedule publish option in WritePage toolbar |
| `article_duplicate` | Duplicate action in LibraryPage |
| `collaboration_coauthor` | Coauthor picker in WritePage |
| `earnings_dashboard` | EarningsPage + real earnings data in StatsPage |
| `tips` | "Tip this writer" button on ArticlePage |
| `content_reports` | Report Abuse button on ArticlePage |
| `notification_preferences` | Notification prefs tab in ProfilePage settings |
| `gdpr_controls` | Data export + account erasure in ProfilePage account tab |
| `session_management` | Active Sessions panel in ProfilePage account tab |
| `block_mute` | Block/Mute buttons on profiles + management panel |
| `organizations` | Org dashboard, members, teams, invitations |
| `org_api_keys` | Org Settings → Developer → API Keys |
| `audit_log` | Org Settings → Audit Log tab |
| `custom_domains` | Creator custom domain in profile settings |
| `org_subdomain` | Org Settings → Subdomain config |
| `sso` | Org Settings → SSO (enterprise only) |
| `newsletters` | Newsletter management page |
| `analytics_dashboard` | Real analytics data in StatsPage |
| `workflow_builder` | Visual workflow builder tabs in WorkflowPage |
| `courses` | Courses browse + builder + learner pages |
| `community` | Community Spaces pages |
| `connectors` | Connectors panel in Org Settings |
| `marketplace` | Marketplace browse + item pages |
| `podcasts` | Podcasts browse + creator management |
| `publications` | Publications page |
| `marketing_tools` | Marketing channels + A/B tests page |
| `leads` | Leads & CRM page |
| `referrals` | Referral widget in profile |
| `usage_alerts` | Usage & quota panel in Org Settings |
| `vault` | Secrets Vault panel in Org Settings |
| `workflow_costs` | Workflow cost tracking in WorkflowPage |
| `admin_earnings` | Admin earnings calculation section |
| `admin_billing` | Admin billing reconciliation section |
| `admin_compliance` | Admin GDPR erasure queue section |

---

## Announcement Integration per Feature

When a flag transitions state, the `FeatureAnnouncementBanner` (Section 0.2) will auto-display if the flag's `metadata.channels` includes `'in_app'`. The copy comes from the flag's own `enabled_title / enabled_summary / disabled_title / disabled_summary` fields, authored in the Feature Flags admin panel.

**Admin workflow for releasing a feature:**

1. Create flag in `AdminPage → Feature Flags` with relevant copy in all metadata fields.
2. Set `channels: ['in_app']` (and optionally `'email'`, `'push'` for external notifications).
3. Set `target_type` + `targets` (e.g. `percentage: 10` for gradual rollout).
4. Click **Preview Announcement** to verify copy (calls `/api/admin/feature-flags/preview-announcement`).
5. Toggle flag `is_active: true` → `FeatureAnnouncementBanner` will appear for targeted users on next page load.

**Disabling a feature** follows the same flow using `disabled_title / disabled_summary`.

---

## Implementation Order Recommendation

```
1. Section 0       — Feature flag consumer hook + FeatureAnnouncementBanner + FeatureComingSoon [x complete]
2. P1-1 to P1-5    — Reading Lists, Revisions, Schedule, Duplicate, Coauthors   (writer power tools) [x complete]
3. P1-6 to P1-11   — Earnings, Reports, Notif Prefs, GDPR, Sessions, Block/Mute (account infra) [x] completed
4. P2-1            — Organizations (needed by all P2-x and P4-6/4-7/4-8) [x] completed
5. P2-2 to P2-6    — API Keys, Audit Log, Domains, Subdomain, SSO [x] completed
6. P3-1 to P3-2    — Newsletters, Analytics [x] completed
7. P3-3            — Workflow Builder [x completed]
8. P3-4 to P3-7    — Courses, Community, Connectors, Marketplace [x] completed
9. P4-1 to P4-11   — Podcasts, Publications, Marketing, Leads, Referrals, Usage, Costs, Admin extensions [x completed]
```
