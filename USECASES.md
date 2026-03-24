# zenos.work Frontend — Use Cases and Flows

This document captures frontend-facing use cases and UI flow coverage for MVP1, MVP2, and MVP3.

## MVP Scope Coverage

### MVP1: Publishable Knowledge Platform

- Google authentication entry and session bootstrap
- Reader home feed and article reader experience
- Author draft creation, editing, and submission
- Dynamic content-type selection in writing and search filters
- SR-010: in-article table of contents generated from heading structure
- SR-011: article success signals panel showing:
  - Verification freshness signal
  - Engagement traction signal (views, likes, comments)
  - Outcome evidence signal from outcome tags
    - Backed by SR-011 analytics pipeline (event capture + hourly backend aggregation)

### MVP2: Trust, Compliance, and Moderation

- Approval queue and moderation controls for privileged roles
- Rejection feedback visibility and resubmission flow
- Policy-aware role gating in UI routes and actions
- Metadata-aware publishing screens (verification and content validity)

### MVP3: Discovery and Growth Loops

- Personalised discovery and search refinement
- Social engagement surfaces (likes, bookmarks, follows)
- Notification-driven return loops
- Admin analytics visibility and content governance controls

## Frontend Use-Case Diagram

```mermaid
flowchart LR
    reader[Reader]
    author[Author]
    approver[Approver]
    superadmin[Superadmin]

    subgraph app[Zenos Frontend Application]
        auth[Sign in with Google]
        discover[Browse feed and search]
        read[Read article with TOC]
        draft[Create or edit article draft]
        submit[Submit article for approval]
        review[Approve or reject article]
        manageTypes[Add or manage content types]
    end

    reader --> auth
    reader --> discover
    reader --> read

    author --> draft
    author --> submit
    author --> discover
    author --> read

    approver --> review
    approver --> read

    superadmin --> manageTypes
    superadmin --> review
    superadmin --> discover
```

## Frontend Sequence Diagram

```mermaid
sequenceDiagram
    actor Author
    participant UI as Browser UI
    participant WritePage as WritePage.tsx
    participant Client as API Client
    participant PublicAPI as /api/articles/content-types
    participant AdminAPI as /api/admin/content-types
    participant ArticleAPI as /api/articles

    Author->>UI: Open write route
    UI->>WritePage: Render compose screen
    WritePage->>Client: getArticleContentTypes()
    Client->>PublicAPI: GET /api/articles/content-types
    PublicAPI-->>Client: Active content types
    Client-->>WritePage: content type options
    WritePage-->>Author: Show dynamic type selector

    alt Actor is SUPERADMIN and adds type
        Author->>WritePage: Submit new type form
        WritePage->>Client: createContentType(payload)
        Client->>AdminAPI: POST /api/admin/content-types
        AdminAPI-->>Client: 201 created
        Client-->>WritePage: created content type
        WritePage->>Client: getArticleContentTypes()
        Client->>PublicAPI: GET /api/articles/content-types
        PublicAPI-->>WritePage: refreshed options
    end

    Author->>WritePage: Fill article form and click Save
    WritePage->>Client: createArticle(payload)
    Client->>ArticleAPI: POST /api/articles
    ArticleAPI-->>Client: 201 DRAFT article
    Client-->>WritePage: draft saved

    Author->>WritePage: Click Submit for approval
    WritePage->>Client: submitArticle(articleId)
    Client->>ArticleAPI: POST /api/articles/:id/submit
    ArticleAPI-->>WritePage: 200 SUBMITTED
    WritePage-->>Author: Show submitted confirmation
```

## Frontend Sequence Diagram (Reader Success Signals)

```mermaid
sequenceDiagram
    actor Reader
    participant UI as Browser UI
    participant ArticlePage as ArticlePage.tsx
    participant Client as API Client
    participant ArticleAPI as /api/articles/:id_or_slug

    Reader->>UI: Open article route
    UI->>ArticlePage: Mount reader page
    ArticlePage->>Client: getArticle(slug)
    Client->>ArticleAPI: GET /api/articles/:id_or_slug
    ArticleAPI-->>Client: Article with verification, engagement, tags
    Client-->>ArticlePage: article payload

    ArticlePage->>ArticlePage: Build TOC from headings (SR-010)
    ArticlePage->>ArticlePage: Compute success signals (SR-011)
    ArticlePage-->>Reader: Render TOC + success signals panel
    Note over ArticleAPI: Backend records lightweight events and aggregates success rates hourly
```
