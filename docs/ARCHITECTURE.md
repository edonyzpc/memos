# Memos Architecture

## Overview
Memos is a self-hosted note-taking platform built with a Go backend and a React/TypeScript frontend.
The backend exposes gRPC services (primary) and a REST gateway via grpc-gateway. The frontend is a
Vite-built SPA served by the Go server in production.

## Repository Layout
- `bin/memos/main.go`: Application entry point and CLI handling.
- `server/`: HTTP + gRPC server, routing, and background runners.
- `server/router/api/v1/`: gRPC services and REST gateway handlers.
- `server/router/frontend/`: Static asset embedding and SPA serving.
- `store/`: Data access layer with multi-database support and migrations.
- `proto/`: Protobuf API definitions and generated code.
- `web/`: React/TypeScript SPA (Vite build pipeline).
- `plugin/`: Optional integrations (S3, OAuth, webhook, etc.).

## Backend Architecture
- **Protocol**: gRPC-first APIs defined in `proto/api/v1/*.proto`.
- **REST Gateway**: grpc-gateway exposes REST endpoints under `/api/v1/*`.
- **Server**: Echo HTTP server + cmux for HTTP/1.1 and gRPC on a single port.
- **Auth**: gRPC interceptors enforce auth and logging.
- **Storage**: `store/` defines interfaces; driver-specific implementations live in `store/db/{sqlite,postgres,mysql}`.
- **Migrations**: Versioned SQL in `store/migration/{sqlite,postgres,mysql}`.

## Frontend Architecture
- **Framework**: React 18 + TypeScript.
- **Build Tooling**: Vite (see `web/vite.config.mts`).
- **State Management**: MobX stores in `web/src/store`.
- **Routing**: React Router with lazy-loaded page routes in `web/src/router/index.tsx`.
- **Styling**: Tailwind + theme CSS in `web/src/themes/*`.
- **Generated Types**: Protobuf TS in `web/src/types/proto`.

## Runtime Flow
1. Go server starts (`server/server.go`), sets up Echo routes, gRPC server, and grpc-gateway.
2. Production builds of the frontend are embedded and served from `server/router/frontend/dist`.
3. The SPA boots in `web/src/main.tsx`, initializes workspace + user state, then renders routes.
4. API calls use gRPC-web clients in `web/src/grpcweb.ts` and generated TS stubs.

## Build and Release
- **Backend**: `go build -o ./build/memos ./bin/memos/main.go`
- **Frontend**: `pnpm build` (dev) or `pnpm release` (outputs to `server/router/frontend/dist`).

## Notable Performance Hotspots
- Large optional libs (leaflet, katex, mermaid, highlight.js) can inflate initial JS if not lazily loaded.
- Initial store bootstrapping in `web/src/main.tsx` blocks first paint.
- Avatar delivery uses raw image payloads; small display sizes benefit from resizing.
- SPA cache headers should avoid long caching of HTML while aggressively caching hashed assets.
