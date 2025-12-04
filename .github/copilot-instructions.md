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

This project demonstrates three techniques that optimize different layers:

### Performance Optimizations (Ranked by Impact):
1. **DataLoader** (Server → Database) - 99% DB query reduction - THE BIGGEST WIN!
2. **HTTP Batching** (Client → Server) - 80% network overhead reduction
3. **useFragment** (Component → Cache) - 99% fewer re-renders on updates

### When Each Pattern Shines
- **DataLoader**: ✅ ALWAYS - Non-negotiable for production! Reduces 3001 queries to 4.
- **HTTP Batching**: Dashboards with 10+ independent widgets executing simultaneously
- **useFragment**: Real-time updates (likes, views), lists with 100+ items, frequent field updates

See `docs/adr/0001-usefragment-vs-httpbatch-dataloader.md` for detailed decision rationale.

### Test Pages
Run `npm run dev` to see live demos:
- **🏆 DataLoader**: Database optimization (99% query reduction) - BIGGEST WIN
- **🚀 HTTP Batching**: Network optimization (5 requests → 1) - Real performance
- **✨ useFragment**: Re-render optimization - Live cache bindings
- **📱 Feed Demo**: Production example with all patterns combined
- **⚡ Full Comparison**: Side-by-side metrics

**Performance Impact Ranking:**
1. DataLoader: 99% fewer database queries 🥇
2. HTTP Batching: 80% less network overhead 🥈  
3. useFragment: 99% fewer re-renders on list updates 🥉
