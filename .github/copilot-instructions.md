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

## Optimization Approach Decision

This project compares two architectural approaches for GraphQL optimization. See comprehensive documentation in `docs/`:

### The Two Approaches

**Approach 1: UseFragment (Client Cache Optimization)** 
- **Layer**: Client-side cache subscriptions
- **Technique**: Fragment colocation + fine-grained re-renders
- **Benefit**: Only affected components update when data changes (95% fewer re-renders)
- **Best for**: Complex UIs with frequent updates, real-time features, reusable components

**Approach 2: HTTP Batch + DataLoader (Network & Server Optimization)** 
- **Layer**: Network + Server optimization
- **Technique**: HTTP request batching + database query batching  
- **Benefit**: Fewer HTTP requests (35-50% improvement) + No N+1 queries (98% fewer DB queries)
- **Best for**: Dashboard-style UIs, reducing network/database load, simple queries

**Key Insight**: Both approaches work together! They optimize different layers of the stack and are complementary, not alternatives.

### Quick Reference
- [Quick Reference Guide](../docs/QUICK_REFERENCE.md) - Decision tree and common scenarios
- [Research Findings](../docs/RESEARCH_FINDINGS.md) - Industry benchmarks and best practices
- [ADR 0001](../docs/adr/0001-usefragment-vs-httpbatch-dataloader.md) - Detailed decision rationale
- [Comprehensive Guide](../docs/USEFRAGMENT_VS_DATALOADER.md) - Implementation patterns

### Test Page
Run `npm run dev` and navigate to:
- **📱 Feed Demo**: See both approaches working together in production
- **⚡ Approach Comparison Test**: Side-by-side comparison with metrics

Use browser DevTools (Network, Console, React DevTools) to observe each approach's impact.
