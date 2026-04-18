# Zenos Frontend - Production Release v1.0.0

## Summary

- What changed: Initial frontend release for Zenos, delivering the full React/Vite user interface for content discovery, authoring, editorial workflows, organization administration, marketplace, newsletters, reading lists, profile management, and enterprise tenant features.
- Why this change is needed: Provides the frontend surface required to consume backend APIs and enable the first production-ready experience for authors, readers, organizations, and workflow automation on the Zenos platform.
- Scope of impact: Entire frontend application, including pages, UI components, hooks, workflow builder, admin panels, publisher/editor experience, marketplace and newsletter flows, and supporting tests/documentation.

## Validation

- [ ] Frontend tests pass locally
- [ ] Lint/type checks pass locally
- [ ] Build passes locally
- [ ] CI checks pass

## Deployment Impact

- [ ] No deployment impact
- [x] Requires environment variable changes
- [ ] Requires manual rollout steps

## Release Label (Pick at least one)

- [x] feature
- [ ] fix
- [ ] security
- [ ] breaking-change
- [ ] docs
- [ ] chore

## Checklist

- [ ] Linked issue/task
- [x] Added/updated tests where needed
- [x] Updated docs/README where needed
- [ ] No secrets committed (.env, keys, tokens)

## Notes for Release

- User-visible changes: Launches the Zenos frontend experience with article and series browsing, author/editor tools, workflow building, organization and profile management, newsletter and marketplace pages, and reader-facing content interactions.
- Risks / rollback plan: Roll back by redeploying the previous frontend release artifact and restoring prior environment configuration. Validate API endpoint and auth environment values before release to avoid broken login or content flows.
