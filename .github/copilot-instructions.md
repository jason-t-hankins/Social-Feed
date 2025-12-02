# Copilot Instructions for Social-Feed

## Project Overview
- **Social-Feed** is a full-stack demo app with a React + Apollo Client frontend and an Apollo Server backend (Node.js/TypeScript) using MongoDB.
- The project demonstrates best practices for GraphQL data fetching: fragment colocation, DataLoader batching, and HTTP request batching.

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

## Optimization Patterns - Key Decision

This project demonstrates three complementary GraphQL optimization patterns. See comprehensive documentation in `docs/`:

### When to Use Each Pattern

**DataLoader (Server):** ✅ ALWAYS
- Solves N+1 query problem
- Required for production GraphQL servers
- 98% reduction in database queries (research-backed)

**HTTP Batching (Network):** ⚠️ TEST FIRST
- Reduces HTTP overhead (35-50% improvement)
- Most beneficial with HTTP/1.1 and high-latency networks
- Less impact with HTTP/2 multiplexing

**useFragment (Client):** ⚠️ FOR COMPLEX UIs
- Prevents unnecessary re-renders (95% reduction)
- Best for real-time updates and reusable components
- Adds complexity - only use when beneficial

### Quick Reference
- [Quick Reference Guide](../docs/QUICK_REFERENCE.md) - Decision tree and common scenarios
- [Research Findings](../docs/RESEARCH_FINDINGS.md) - Industry benchmarks and best practices
- [ADR 0001](../docs/adr/0001-usefragment-vs-httpbatch-dataloader.md) - Detailed decision rationale
- [Comprehensive Guide](../docs/USEFRAGMENT_VS_DATALOADER.md) - Implementation patterns

### Test Pages
Run `npm run dev` and navigate to test pages:
- **HTTP Batching Test**: Compare batched vs non-batched performance
- **useFragment Test**: Visualize re-render optimization
- **DataLoader Test**: See N+1 query resolution in action

Use browser DevTools (Network, Console, React DevTools) to observe each pattern's impact.
