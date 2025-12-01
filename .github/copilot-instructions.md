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

## Summary - Task 1

- Explore and develop comprehensive guidance on when to use UseFragment versus HTTP Batch combined with Facebook DataLoader (apollo-datasource-mongodb) in Apollo Client/Server.

## UseFragment vs HTTP Batch + Facebook DataLoader (with A/B Tests & APQ Considerations)

    Design and implement A/B testing on screens that execute many different GraphQL queries simultaneously, to compare the real-world impact of each approach.
    Examine query composition patterns, including how queries are batched, how fragments are reused, and how DataLoader aggregates requests.
    Evaluate the use and impact of Colocated Fragments in both the UseFragment and HTTP Batch + DataLoader approaches.
        Review the latest Apollo guidance and community practices, including the concepts and examples from this Apollo YouTube demo.
        Analyze how colocated fragments affect component modularity, cache consistency, query efficiency, and developer experience in each scenario.
    Analyze the resulting behavior at the database level for each approach, including:
        The number and shape of queries sent to the database.
        The volume and structure of returned data.
        Impact on performance and data consistency.
    Assess how each approach interacts with Apollo Persisted Queries (APQ), noting any compatibility issues or required workarounds.
    Develop clear, scenario-based guidance for when to use each approach, including trade-offs, performance implications, and maintainability considerations.
    Document all findings in an ADR, capturing the evaluation process, test results, and the rationale behind recommended best practices.
