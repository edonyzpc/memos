# Share Memo Image Rendering - ECS Test Steps

## Scope
These steps capture the ECS validation flow for the render service + share
sandbox page. This is intended for repeatable manual verification without
touching production web.

## Prerequisites
- Local dev web: `make web` (http://localhost:3001)
- Render repo: `https://github.com/edonyzpc/memos-images-rendering`
- ECS host: `root@cn-ubuntu-ecs`
- Render container uses host network and calls local dev web via reverse SSH
  tunnel on `127.0.0.1:13001`.
- Default render size: 2400x1350 (16:9), `DEFAULT_DPR=5`.

## Build + Deploy (ECS)
1) Package the render repo:
```bash
tar -czf /tmp/memos-images-rendering.tar.gz -C /Users/edonyzpc/code memos-images-rendering
```

2) Upload to ECS:
```bash
scp /tmp/memos-images-rendering.tar.gz root@cn-ubuntu-ecs:/root/memos-images-rendering.tar.gz
```

3) Extract on ECS:
```bash
ssh root@cn-ubuntu-ecs \
  'rm -rf /root/memos-images-rendering && mkdir -p /root/memos-images-rendering && \
   tar -xzf /root/memos-images-rendering.tar.gz -C /root/memos-images-rendering --strip-components=1'
```

4) Build the docker image:
```bash
ssh root@cn-ubuntu-ecs 'docker build -t memos-render:local /root/memos-images-rendering'
```

## Start Render + Tunnel
5) Run render container (host network):
```bash
ssh root@cn-ubuntu-ecs \
  'docker rm -f memos-render 2>/dev/null || true && \
   docker run -d --name memos-render --network host \
   -e MEMOS_BASE_URL=http://127.0.0.1:13001 \
   -e DEFAULT_DPR=5 \
   memos-render:local'
```

6) Start reverse SSH tunnel (ECS -> local dev web):
```bash
ssh -f -N -R 127.0.0.1:13001:localhost:3001 root@cn-ubuntu-ecs
```

## Render Test Image
7) Trigger render via sandbox route:
```bash
ssh root@cn-ubuntu-ecs \
  'curl -s -X POST http://127.0.0.1:8787/render/share-memo \
   -H "Content-Type: application/json" \
   -d "{\"memoId\":\"sandbox\",\"token\":\"sandbox\",\"mode\":\"auto\",\"width\":2400,\"height\":1350}" \
   --output /tmp/share-sandbox.png'
```

8) Pull image to local:
```bash
scp root@cn-ubuntu-ecs:/tmp/share-sandbox.png /tmp/share-sandbox.png
```

9) Verify dimensions locally:
```bash
sips -g pixelWidth -g pixelHeight /tmp/share-sandbox.png
ls -lh /tmp/share-sandbox.png
```

## Cleanup
10) Stop render container:
```bash
ssh root@cn-ubuntu-ecs 'docker rm -f memos-render'
```

11) Stop tunnel:
```bash
pgrep -f "ssh -f -N -R 127.0.0.1:13001:localhost:3001 root@cn-ubuntu-ecs" | xargs -r kill
```

## Notes
- Fonts installed in render image: Inter + Noto CJK + Noto UI Core + emoji.
- Sandbox route: `/share/memo/:id` (dev-only) renders `ShareMemoCard`.
- The rendered output uses `mode=auto` sizing with 16:9 aspect ratio.
- Default output should be 2400x1350 unless width/height is overridden.

## Phase D — Local End-to-End Verification
These steps validate auth + share-image + signed URL behavior locally.

### Start services
1) Start render service:
```bash
nohup env MEMOS_BASE_URL=http://localhost:3001 DEFAULT_DPR=5 \
  node /Users/edonyzpc/code/memos-images-rendering/server.js \
  > /tmp/memos-render.log 2>&1 & echo $! > /tmp/memos-render.pid
```

2) Start memos server:
```bash
nohup env MEMOS_RENDER_SERVICE_URL=http://127.0.0.1:8787 \
  MEMOS_INSTANCE_URL=http://localhost:3001 \
  make memos \
  > /tmp/memos-server.log 2>&1 & echo $! > /tmp/memos-server.pid
```

3) Start memos web:
```bash
nohup make web > /tmp/memos-web.log 2>&1 & echo $! > /tmp/memos-web.pid
```

### D1 — Private memo share image export (auth + token)
4) Create a session (local dev uses `test/test` by default):
```bash
curl -s -X POST http://localhost:5230/api/v1/auth/sessions \
  -H "Content-Type: application/json" \
  -d '{"passwordCredentials":{"username":"test","password":"test"}}' \
  -D /tmp/memos-session.headers -o /tmp/memos-session.json
```

5) Call share-image API:
```bash
curl -s -X POST http://localhost:5230/api/v1/memos/3UHmev8vLdRDg6mVsxt38N/share-image \
  -H "Content-Type: application/json" \
  -H "Cookie: user_session=1-<session-id>" \
  -d '{"mode":"auto","width":2400,"height":1350,"deviceScaleFactor":5}' \
  --output /tmp/share-image.png
```

6) Verify output:
```bash
file /tmp/share-image.png
sips -g pixelWidth -g pixelHeight /tmp/share-image.png
ls -lh /tmp/share-image.png
```

### D2 — Signed URLs for attachments
7) Generate a short-lived share token (dev secret is `usememos`):
```bash
python3 - <<'PY'
import base64, json, hmac, hashlib, time, urllib.request
secret = b"usememos"
memo = "3UHmev8vLdRDg6mVsxt38N"
now = int(time.time())
header = {"alg":"HS256","typ":"JWT","kid":"v1"}
payload = {"iss":"memos","aud":"memo.share-image","sub":memo,"memo":memo,"iat":now,"exp":now+300}
def b64url(d): return base64.urlsafe_b64encode(d).rstrip(b"=")
msg = b64url(json.dumps(header,separators=(",",":")).encode()) + b"." + b64url(json.dumps(payload,separators=(",",":")).encode())
sig = hmac.new(secret, msg, hashlib.sha256).digest()
token = (msg + b"." + b64url(sig)).decode()
url = f"http://localhost:5230/api/v1/share/memos/{memo}?token={token}"
with urllib.request.urlopen(url) as f:
    data = json.load(f)
atts = data.get("memo", {}).get("attachments", [])
print("attachments:", len(atts))
for att in atts:
    print(att.get("filename"), att.get("externalLink"))
PY
```

8) Fetch the signed URL to confirm access:
```bash
curl -s "http://localhost:5230/file/attachments/<id>/<filename>?exp=...&sig=..." \
  --output /tmp/share-attachment.png
file /tmp/share-attachment.png
```

### D3 — Fallback validation (manual UI)
9) Stop render service and open ShareMemoDialog. It should fallback to html2image.

### D4 — Browser validation (manual UI)
10) Validate share image preview/export in Chrome + Safari.

## Status
- D3/D4 completed and matched expected results.

### Cleanup
```bash
kill $(cat /tmp/memos-render.pid)
kill $(cat /tmp/memos-server.pid)
kill $(cat /tmp/memos-web.pid)
```
