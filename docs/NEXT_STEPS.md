# Next Steps: Completing Public Caching Implementation

## Current Status ✅

The foundation is complete! Here's what's been set up:

### Client-side
- ✅ Reorganized demos into logical folders (`demos/01-http-batching`, etc.)
- ✅ Created auth context with JWT management
- ✅ Built authenticated Apollo Client (with JWT headers)
- ✅ Built public Apollo Client (with APQ, no auth)
- ✅ Created public caching demo page skeleton
- ✅ Updated navigation to include new demo

### Server-side
- ✅ JWT utilities (generate, verify, extract token)
- ✅ Auth middleware (required & optional)
- ✅ Folder structure for separate endpoints

### Documentation
- ✅ ADR-0002: Public GraphQL Caching (comprehensive guide)
- ✅ Updated README with new architecture
- ✅ Implementation guide created

## Next: Complete the Implementation

### 1. Update Server Entry Point (30 min)

**File**: `server/src/index.ts`

Add a login endpoint and create two Apollo Server endpoints:

```typescript
// Add login endpoint
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate credentials (use MongoDB users collection)
  const user = await usersCollection.findOne({ username });
  if (!user || password !== 'demo') { // Use bcrypt in production!
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = generateToken(user._id.toString(), user.username);
  res.json({ token, user: { id: user._id, username: user.username } });
});

// Authenticated endpoint (existing /graphql)
app.use(
  '/graphql',
  cors(),
  express.json(),
  optionalJWT, // Make JWT optional for now, can enforce later
  expressMiddleware(server, { context })
);

// Public endpoint (new)
app.use(
  '/graphql-public',
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async () => ({
      loaders: createDataLoaders(...),
      // No user context
    })
  })
);
```

### 2. Add Public Queries to Schema (15 min)

**File**: `server/src/schema/typeDefs.ts`

```graphql
extend type Query {
  # Public queries (no auth required)
  publicFeed(first: Int = 10, after: String): PostConnection!
  publicPost(id: ID!): Post
}
```

### 3. Add Resolvers for Public Queries (20 min)

**File**: `server/src/resolvers/index.ts`

```typescript
Query: {
  // ... existing resolvers
  
  publicFeed: async (_, { first, after }, { collections, loaders }) => {
    // Same as feed but no user context
    const posts = await collections.posts
      .find()
      .sort({ createdAt: -1 })
      .limit(first)
      .toArray();
    
    // Return connection format
    return {
      edges: posts.map(post => ({ node: post })),
      pageInfo: { hasNextPage: false },
    };
  },
  
  publicPost: async (_, { id }, { loaders }) => {
    return loaders.postLoader.load(id);
  },
}
```

### 4. Wire Up Demo Components (30 min)

**Files**: 
- `client/src/graphql/queries.ts` - Add public queries
- `client/src/demos/03-public-caching/PublicCachingDemo.tsx` - Add feed rendering

Create queries:

```typescript
// Public feed query
export const GET_PUBLIC_FEED = gql`
  query GetPublicFeed($first: Int!) {
    publicFeed(first: $first) {
      edges {
        node {
          id
          content
          author {
            displayName
            avatarUrl
          }
          likeCount
          commentCount
        }
      }
    }
  }
`;
```

Update demo to use queries and display results.

### 5. Test Everything (30 min)

1. **Start servers**: `npm run dev`
2. **Open browser**: http://localhost:3000
3. **Navigate to**: 🌐 Public Caching
4. **Open DevTools**: Network tab
5. **Test flow**:
   - Click "Login as Demo User"
   - Observe authenticated requests (POST with Bearer token)
   - View public requests (GET with query hash)
   - Check cache headers
   - Reload page and verify caching

## Quick Wins

If short on time, prioritize:

1. **Just get it working** (1-2 hours):
   - Add login endpoint
   - Add publicFeed query
   - Wire up to demo page
   - Test in browser

2. **Make it production-ready** (4-6 hours):
   - Add all security checks
   - Implement proper password hashing
   - Add error handling
   - Write tests
   - Tune cache headers

## Common Issues

### "Cannot find module 'crypto-hash'"

The APQ link in `public.ts` needs the hash function. If `crypto-hash` doesn't work:

```typescript
// Alternative: Use built-in crypto
import { createHash } from 'crypto';

const sha256 = (data: string) => {
  return createHash('sha256').update(data).digest('hex');
};
```

### "Authorization header still in public requests"

Check:
1. `publicClient` doesn't have `authLink`
2. Demo is using `publicClient` not `authenticatedClient`
3. No global auth interceptors

### "Cache not working"

Check:
1. Using GET requests (`useGETForQueries: true`)
2. Cache-Control headers set on server
3. Browser cache not disabled in DevTools
4. APQ enabled and working

## Testing Checklist

- [ ] Login works and returns token
- [ ] Token stored in localStorage
- [ ] Authenticated requests include Bearer token
- [ ] Public requests have NO auth header
- [ ] Public requests use GET with query hash
- [ ] Cache-Control headers present
- [ ] Page reload hits cache for public queries
- [ ] Logout clears token
- [ ] DataLoader still working (check server logs)

## Performance Validation

Once working, measure:

1. **Before caching** (no cache headers):
   - Time to first byte (TTFB)
   - Total request time
   - Number of server requests

2. **After caching** (with cache headers):
   - TTFB from cache
   - Cache hit rate
   - Reduction in server load

Expected results:
- 50-80% faster TTFB (cache hits)
- 70-90% cache hit rate
- 80-95% reduction in server requests

## File Summary

**Modified**:
- `client/src/App.tsx` - Added public caching navigation
- `client/src/main.tsx` - Wrapped in AuthProvider
- `README.md` - Updated with new architecture

**Created**:
- `client/src/auth/` - Auth context
- `client/src/apollo-configs/` - Dual Apollo configs
- `client/src/demos/01-04/` - Reorganized demos
- `server/src/auth/` - JWT utilities
- `server/src/middleware/` - Auth middleware
- `docs/adr/0002-public-graphql-caching.md` - Complete ADR
- `docs/PUBLIC_CACHING_GUIDE.md` - Implementation guide

**Still TODO**:
- `server/src/index.ts` - Add endpoints
- `server/src/schema/typeDefs.ts` - Add public queries
- `server/src/resolvers/index.ts` - Add resolvers
- `client/src/graphql/queries.ts` - Add queries
- `client/src/demos/03-public-caching/` - Complete demo

## Ready to Code!

You have everything you need:
- ✅ Clean, organized structure
- ✅ Auth infrastructure
- ✅ Apollo Client configs
- ✅ Comprehensive ADR
- ✅ Clear next steps

Start with `server/src/index.ts` and work through the steps above. The foundation is solid - now just connect the pieces! 🚀
