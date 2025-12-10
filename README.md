# Social-Feed

**Complete GraphQL optimization patterns**: Client-side, Server-side, and Network-layer optimizations with React + Apollo Client + Apollo Server + MongoDB.

## Quick Start

```bash
npm install
npm run dev
```

- Client: `http://localhost:3000`
- Server: `http://localhost:4000/graphql`

**No MongoDB?** Use `USE_MOCK_DB=true npm run dev`

## What This Demonstrates

Four comprehensive demo suites are present which show various enhancements for the Apollo client/server. Exstensive research and decisions for implementations are outlined in the following ADRs:

## Architecture Decision Records

- **[ADR-0001](docs/adr/0001-usefragment-vs-httpbatch-dataloader.md)**: useFragment vs HTTP Batch + DataLoader
- **[ADR-0002](docs/adr/0002-public-graphql-caching.md)**: Public GraphQL Caching for CDNs

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Apollo Server  │────▶│    MongoDB      │
│   Apollo Client │◀────│   DataLoader    │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      │                        │
      │ HTTP Batching          │ Query Batching
      │ useFragment            │ N+1 Resolution
      └────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Start MongoDB (if local)
# mongod

# Start development servers
npm run dev
```

This starts:
- GraphQL Server: http://localhost:4000
- React Client: http://localhost:3000

### Sample Queries

```graphql
# Get the social feed
query GetFeed {
  feed(first: 10) {
    edges {
      node {
        id
        content
        author {
          displayName
          avatarUrl
        }
        commentCount
        likeCount
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
```


## Testing Batching Efficiency

1. Start the server and watch console output
2. Follow Instructions for each test
3. Open browser DevTools Network tab, filter for graphql as well as monitoring server console logs.
