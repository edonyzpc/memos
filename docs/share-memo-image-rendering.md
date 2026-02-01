# Share Memo Image Rendering (Server-Side)

## Background
The current Share Memo image export relies on `html2image` (SVG `foreignObject`).
This causes cross-browser rendering inconsistencies (e.g. tag overlap in Chrome
and missing rounded corners in Safari) and makes it difficult to guarantee that
preview and exported images are identical.

## Goals
- Preview image must be identical to exported image.
- Support private memos securely.
- Keep memos backend decoupled from rendering runtime (Chromium/Playwright).
- Allow future scaling without touching core memo logic.
- Rendered image should keep a 16:9 aspect ratio (pad as needed), suitable for sharing on X and other social platforms.

## Non-Goals
- Pixel-perfect parity across all client browsers with DOM-based rendering.
- Rewriting memo rendering logic or markdown pipeline.

## Proposed Architecture

### 1) Dedicated Render Service (separate repo)
- Node.js + Playwright (Chromium).
- Internal-only service (only reachable from memos backend via private network).
- Exposes a simple HTTP API to render a share page and return a PNG.

Example API (internal):
```
POST /render/share-memo
{
  "memoId": "memos/xxx",
  "token": "<short-lived>",
  "theme": "light|dark",
  "locale": "zh-Hans",
  "width": 1200,
  "height": 675,
  "deviceScaleFactor": 2
}
```
Response: `image/png` binary.

### 2) Memos Backend (lightweight API)
- Add a minimal API endpoint that:
  - Verifies memo access.
  - Issues a short-lived token (1–5 minutes).
  - Calls the render service over internal network.
  - Returns PNG to the client.

Proposed endpoint:
```
POST /api/v1/memos/{id}/share-image
```

### 3) Share Page (new route)
- Add a new route: `/share/memo/:id`
- Only renders the card content (no dialog chrome, no buttons), reusing
  the existing share card UI.
- Renders based on token and uses a share-data API to fetch memo + creator data.

Share-data API response should include everything currently used in
ShareMemoDialog:
- memo: `name`, `content`, `displayTime`, `attachments[]`
- creator: `displayName`, `username`, `avatarUrl`
- attachments: include `name`, `filename`, `type`, and `signedUrl`
  (optionally `thumbnailUrl` for images)

### 4) Frontend Preview
- ShareMemoDialog displays the PNG preview returned by the backend.
- Download uses the same PNG, guaranteeing preview == export.
- If render fails, fallback to current `html2image` export flow.

## Detailed Design

### Share JWT
Claims (HS256, existing server secret):
- `iss`: `memos`
- `aud`: `memo.share-image`
- `sub`: user id
- `memo`: memo resource name (e.g. `memos/<uid>`)
- `exp`: now + 5 minutes

Validation rules:
- Signature is valid.
- `aud` is `memo.share-image`.
- `exp` is not expired.
- `memo` matches requested memo id.

### Share Data API (new)
Endpoint:
```
GET /api/v1/share/memos/{id}
Authorization: Bearer <share-jwt>
```

Response shape (JSON):
```
{
  "memo": {
    "name": "memos/<uid>",
    "content": "...",
    "displayTime": "2026-01-21T12:08:04Z",
    "attachments": [
      {
        "name": "attachments/<uid>",
        "filename": "image.png",
        "type": "image/png",
        "signedUrl": "https://.../file/.../image.png?exp=...&sig=...",
        "thumbnailUrl": "https://.../file/.../image.png?thumbnail=true&exp=...&sig=..."
      }
    ]
  },
  "creator": {
    "displayName": "cuddlepig",
    "username": "cuddlepig",
    "avatarUrl": "https://..."
  }
}
```

Notes:
- This endpoint is only used by `/share/memo/:id`.
- Memo access rules mirror `GetMemo` (public/protected/private).
- It is intentionally decoupled from existing `GetMemo`/`GetUser` ACLs.

### Share Page Rendering
- Route: `/share/memo/:id?token=<share-jwt>&theme=light|dark&locale=...`
- On load, extract `token` and call the share-data API.
- Reuse a new `ShareMemoCard` component shared with ShareMemoDialog.
- Add a render-ready signal when all images are loaded:
  - `window.__MEMO_SHARE_READY__ = true`
  - Or set `data-render-ready="true"` on root.

### Render Service (Playwright)
1. Launch Chromium.
2. Open `/share/memo/:id?...` on memos web.
3. Wait for `window.__MEMO_SHARE_READY__ === true`.
4. Screenshot the `.share-memo-canvas` element.
5. Pad to 16:9 if needed (see sizing section).
6. Return PNG.

### Image Sizing
- Baseline output: 1200x675 (16:9).
- If card height exceeds 675, increase width to keep 16:9:
  - `width = ceil(height * 16 / 9)`
  - Keep background gradient centered.
- If card height is smaller, pad vertically to 675.

### ShareMemoDialog Fallback
- If backend render fails or times out:
  - fallback to current `html2image` flow.

## Data Flow
1. User opens ShareMemoDialog.
2. Frontend requests `POST /api/v1/memos/{id}/share-image`.
3. Backend issues short-lived token and calls Render Service.
4. Render Service launches Chromium, loads `/share/memo/:id?token=...`,
   waits for the card to finish rendering, and screenshots the card element.
5. Backend returns PNG to frontend.
6. Frontend displays PNG preview and downloads the same file.
7. On render failure, frontend falls back to existing `html2image` flow.

## Security
- Token is short-lived (1–5 minutes).
- Token scope limited to memoId + visibility check.
- Render Service is internal-only; no public access.
- Share page requires valid token; otherwise 403.

### Token Options
**JWT (selected)**
- Stateless verification (no DB/cache lookup).
- Can encode `memoId`, `exp`, and a dedicated audience like `memo.share-image`.
- Easier to deploy in a decoupled render service.
- Downside: cannot revoke before expiry; token is larger and can leak metadata if exposed.

**Opaque token**
- Random token with server-side storage (DB/Redis/in-memory) for lookup.
- Easy to revoke; token reveals nothing.
- Downside: requires storage + cleanup, and complicates horizontal scaling.

Note: existing access-token JWTs in memos are stored/validated against a user
token list, so share tokens should be separate (new audience + new validator).

### Attachment Access (selected: signed URLs)
The share card renders memo attachments. For private memos, the render flow
must allow the share page to fetch `/file/...` resources.
Options:
- Return signed, short-lived URLs for attachments in the share-data response
  so the share page never needs extra auth.
Selected scheme:
- HMAC query signature for local attachments
  - Query params: `exp` (unix seconds), `sig` (hex HMAC-SHA256)
  - Signature base string: `path + \"|\" + exp + \"|\" + variant` where
    `variant` is `full` or `thumb` to prevent swapping.
  - TTL: 5 minutes (aligns with share JWT expiry).

#### Full vs Thumbnail (share-data)
- **Full**: original binary; highest resolution; best for share-card rendering.
- **Thumbnail**: server-generated downscale (max dimension ~600px); faster for
  lists but can look soft in exported images.
- **Decision**: share-data returns **full** URLs to preserve clarity; thumbnails
  are not used in the share flow.

### Image Size (selected)
- Default output size: **2400 x 1350 (16:9)**.
- Render at `deviceScaleFactor: 5` for sharp text on high-DPI displays.
- Optional override: **1200 x 675** for bandwidth-sensitive scenarios.
- Rationale: 2400px width keeps text crisp on macOS retina screens and
  preserves the 16:9 layout for social feeds.

## Caching
Initial rollout: no caching (always render fresh).

Optional later:
- Cache key = memoId + updateTime + theme + locale + width + dpr.
- Automatic invalidation when memo updates (updateTime changes).

## Deployment
- New repo: `memos-render` (GitHub Actions for test/build/push).
- Docker image runs Node + Playwright Chromium.
- Deploy to second ECS. Expose only private network port.
- Memos backend calls it via private IP or internal DNS.
- No nginx changes required if backend calls render service directly.
  (Optional: add nginx reverse proxy if you want a unified domain.)

## Observability
- Log render duration, failures, and render service health checks.
- Add timeout and retry in backend (e.g. 10s timeout, 1 retry).

## Rollout Plan
1. Implement share page + card extraction in web.
2. Implement backend endpoint + token issuing.
3. Implement render service.
4. Enable ShareMemoDialog to request PNG preview.
5. Keep `html2image` as fallback; deprecate later if stable.

## Open Questions
1. Signed URL details: exact query params (e.g. `exp`, `sig`) and signature scope
   (path-only vs. full URL).
