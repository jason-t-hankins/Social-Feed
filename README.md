# Social-Feed

GraphQL optimization demo: **Fragment Colocation**, **HTTP Batching**, and **DataLoader** with React + Apollo Client + Apollo Server + MongoDB.

## Quick Start

```bash
npm install
npm run dev
```

- Client: `http://localhost:3000`
- Server: `http://localhost:4000/graphql`

**No MongoDB?** Use `USE_MOCK_DB=true npm run dev`

## What This Demonstrates

### 1. DataLoader (Database Optimization)
Eliminates N+1 queries. **99% reduction in database queries!**
- 10 posts: 11 queries → 2 queries (82% faster)
- 1000 posts: 3001 queries → 4 queries (99.9% reduction)
- **Non-negotiable for production**

### 2. HTTP Batching (Network Optimization)
Multiple queries → one HTTP request.
- 5 independent queries → 1 batched HTTP request (80% less overhead)
- Best for dashboards with 10+ simultaneous widgets
- **Visible in DevTools Network tab**

### 3. useFragment (Re-render Optimization)
Lightweight live bindings to cache data.
- Components only re-render when THEIR fragment changes
- Update 1 field in 100 items → only 1 component re-renders
- **Perfect for real-time updates (likes, views, status)**

## Demo Pages

Three pages demonstrating all optimization patterns:

1. **🚀 HTTP Batching (+ DataLoader!)** - Network optimization + server logs visible
2. **✨ useFragment** - Re-render optimization with console demos
3. **⚡ Full Comparison** - Side-by-side metrics

**Note:** DataLoader is ALWAYS running! Watch your server terminal for `[DataLoader]` logs.

- **📋 ADR**: See `docs/adr/0001-usefragment-vs-httpbatch-dataloader.md` for decision rationale

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

## Project Structure

```
social-feed/
├── server/                 # Apollo GraphQL Server
│   └── src/
│       ├── dataloaders/    # DataLoader implementations
│       ├── models/         # TypeScript types
│       ├── resolvers/      # GraphQL resolvers
│       └── schema/         # GraphQL type definitions
├── client/                 # React + Apollo Client
│   └── src/
│       ├── components/     # React components with fragments
│       ├── graphql/        # Queries, mutations, fragments
│       └── apollo.ts       # Apollo Client configuration
└── docs/                   # Documentation
    └── USEFRAGMENT_VS_DATALOADER.md
```

## Key Concepts

### DataLoader (Server-Side)

Batches database queries to solve the N+1 problem:

```typescript
// Without DataLoader: 11 queries for 10 posts
// With DataLoader: 2 queries (posts + batched authors)

const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.find({ _id: { $in: ids } });
  return ids.map(id => users.find(u => u._id.equals(id)));
});
```

### Fragment Colocation (Client-Side)

Components declare their data requirements:

```tsx
const USER_AVATAR_FRAGMENT = gql`
  fragment UserAvatarFragment on User {
    id
    displayName
    avatarUrl
  }
`;

function UserAvatar({ user }) {
  return <img src={user.avatarUrl} alt={user.displayName} />;
}
```

### HTTP Batching

Combines multiple GraphQL operations into single HTTP requests:

```typescript
const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchMax: 10,
  batchInterval: 20,
});
```

## Testing Batching Efficiency

1. Start the server and watch console output
2. Load the feed - observe DataLoader batching logs
3. Open browser DevTools Network tab - observe HTTP batching

## License

MIT
