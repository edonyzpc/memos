# Share Memo Image Rendering - Task Plan

This task plan follows the agreed execution order:
1) Detailed design (completed)
2) Actionable development/verification/testing/deployment plan (this doc)
3) Execute plan with ECS render service validation first

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Completed

## Phase A — Render Service (ECS-first validation)
Goal: Validate headless rendering output before touching memos server.

- [x] A1. Create new repo `memos-render`.
- [x] A2. Implement minimal Playwright render service (HTTP API).
- [x] A3. Add Dockerfile and GitHub Actions build/push.
- [x] A4. Deploy to idle ECS (internal only).
- [x] A5. Manual validation on ECS:
  - [x] Confirm output is 2400x1350 (16:9) via `/render/test`.
  - [x] Render a local dev share page via SSH tunnel.
  - [x] Confirm font/attachments render correctly.

## Phase B — memos Server
Goal: Provide share data, signed URLs, and server-side render orchestration.

- [x] B1. Add share-JWT issuing (aud: `memo.share-image`, TTL 5 min, HS256).
- [x] B2. Add share-data API:
  - `GET /api/v1/share/memos/{id}`
  - Returns memo + creator + attachments (signed URLs).
- [x] B3. Implement signed URL validation (HMAC exp/sig).
- [x] B4. Add share-image API:
  - `POST /api/v1/memos/{id}/share-image`
  - Calls render service and returns PNG.
- [x] B5. Server-side integration test (share-data + signed URL + render API).

## Phase C — Web
Goal: Use server-rendered PNG for preview/export with fallback.

- [x] C1. Add `/share/memo/:id` page (render-only card).
- [x] C2. Extract `ShareMemoCard` component reused by ShareMemoDialog + share page.
- [x] C3. ShareMemoDialog preview uses PNG from `share-image` API.
- [x] C4. On render failure: fallback to existing `html2image` export.
- [x] C5. Frontend validation: preview == export.

## Phase D — End-to-End Verification
Goal: Validate full pipeline in realistic scenarios.

- [x] D1. Private memo share image export (auth + token).
- [x] D2. Attachments render via signed URLs.
- [x] D3. Fallback path works when render service is down.
- [x] D4. Validate on Chrome + Safari.

## Notes
- Render output: `mode=auto` (16:9) sized to content + window constraints.
- DPR: 5 (server-side render).
- Default size: 2400x1350; allow 1200x675 override.
- Signed URL scheme: HMAC with `exp` and `sig`.
- Render service is internal-only; memos backend calls it over private network.
