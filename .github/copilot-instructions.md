# Copilot Instructions for Social-Feed

## Project Overview
**Social-Feed** is a full-stack demo showcasing GraphQL optimization patterns with React + Apollo Client frontend and Apollo Server backend (Node.js/TypeScript) using MongoDB.

## Architecture & Data Flow
- **Client:**
  - Located in `client/`.
  - Uses Apollo Client with HTTP batching (see `src/apollo.ts`).
  - React components colocate GraphQL fragments (see `src/components/` and `src/graphql/fragments.ts`).
- **Server:**
  - Located in `server/`.
  - Apollo Server with DataLoader for N+1 query resolution (see `src/dataloaders/`).
  - GraphQL schema in `src/schema/typeDefs.ts`, resolvers in `src/resolvers/`.
  - MongoDB models in `src/models/`.

## Key Patterns & Conventions
- **Fragment Colocation:**
  - Each React component declares its own GraphQL fragment for the data it needs.
  - Fragments are imported and composed in queries (see `client/src/graphql/fragments.ts`).
- **DataLoader Usage:**
  - All cross-collection lookups (e.g., post author, comment author) use DataLoader to batch DB calls.
  - DataLoader instances are created per-request in the GraphQL context.
- **HTTP Batching:**
  - Apollo Client is configured to batch multiple GraphQL operations into a single HTTP request (see `client/src/apollo.ts`).

## Developer Workflows
- **Install dependencies:** `npm install` (root, client, and server as needed)
- **Start dev servers:** `npm run dev` (starts both client and server)
- **Run tests:**
  - Client: `cd client && npm test` (uses Vitest)
  - Server: `cd server && npm test` (uses Jest)
- **Debug batching:**
  - Watch server logs for DataLoader batching
  - Use browser DevTools to inspect HTTP batching

## Notable Files & Directories
- `client/src/components/` – React components with colocated fragments
- `client/src/graphql/fragments.ts` – Shared GraphQL fragments
- `client/src/apollo.ts` – Apollo Client config (HTTP batching)
- `server/src/dataloaders/` – DataLoader implementations
- `server/src/schema/typeDefs.ts` – GraphQL schema
- `docs/USEFRAGMENT_VS_DATALOADER.md` – In-depth pattern guide

## Integration Points
- **Apollo Client <-> Apollo Server**: All data flows through GraphQL queries/mutations.
- **DataLoader <-> MongoDB**: All batched DB access is via DataLoader.

## Additional Notes
- See the root `README.md` and `docs/USEFRAGMENT_VS_DATALOADER.md` for detailed explanations and examples.
- Follow the fragment colocation and DataLoader patterns for all new features.

## GraphQL Optimization Patterns

This project demonstrates three complementary optimization techniques:

1. **UseFragment** (Client cache) - Fine-grained re-renders, only affected components update
2. **HTTP Batching** (Network) - Multiple queries → single HTTP request (10+ independent queries)  
3. **DataLoader** (Server) - Eliminates N+1 database queries (always use!)

### When Each Pattern Shines
- **UseFragment**: Real-time UIs, reusable components, frequent updates
- **HTTP Batching**: Dashboards with 10+ widgets, admin panels, mobile apps
- **DataLoader**: Any GraphQL server (non-negotiable for production)

See `docs/adr/0001-usefragment-vs-httpbatch-dataloader.md` for detailed decision rationale.

### Test Pages
Run `npm run dev` to see live demos:
- **📱 Feed Demo**: Production example with all patterns
- **🎯 UseFragment Demo**: Click likes → only stats component re-renders (99% fewer re-renders!)
- **🚀 HTTP Batching Demo**: 5 queries without batching vs 1 batched request
- **⚡ Full Comparison**: Side-by-side performance metrics
