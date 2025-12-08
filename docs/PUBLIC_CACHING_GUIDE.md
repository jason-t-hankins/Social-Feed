# Public Caching Implementation Guide

## Overview

This guide walks through the implementation of public GraphQL caching for the Social-Feed demo. The structure has been reorganized to support both authenticated and public queries with proper security boundaries.

## Directory Structure

### Client

```
client/src/
├── demos/                          # Organized by feature
│   ├── 01-http-batching/          # HTTP batching optimization
│   ├── 02-usefragment/            # useFragment pattern
│   ├── 03-public-caching/         # NEW: Public caching demo
│   └── 04-full-comparison/        # Full comparison suite
├── auth/                           # NEW: Authentication context
│   ├── AuthContext.tsx            # JWT auth provider
│   └── index.ts
├── apollo-configs/                 # NEW: Multiple Apollo configs
│   ├── authenticated.ts           # Client with JWT
│   ├── public.ts                  # Client with APQ, no auth
│   └── index.ts
├── components/                     # Shared components
├── graphql/                        # Queries and fragments
└── apollo.ts                       # Original Apollo config
```

### Server

```
server/src/
├── auth/                           # NEW: JWT utilities
│   ├── jwt.ts                     # Token generation/verification
│   └── index.ts
├── middleware/                     # NEW: Auth middleware
│   ├── auth.ts                    # JWT authentication
│   └── index.ts
├── endpoints/                      # NEW: Separate endpoints (TBD)
│   ├── graphql-auth.ts            # /graphql endpoint
│   └── graphql-public.ts          # /graphql-public endpoint
├── dataloaders/                    # Existing DataLoader
├── models/                         # TypeScript types
├── resolvers/                      # GraphQL resolvers
└── schema/                         # GraphQL schemas
```

## What's Implemented

✅ **Client-side**:
- Auth context with JWT management
- Authenticated Apollo Client (with JWT headers)
- Public Apollo Client (with APQ, no auth)
- Public caching demo page UI
- Updated navigation and structure

✅ **Server-side**:
- JWT token generation/verification utilities
- Auth middleware (required and optional)
- Infrastructure for separate endpoints

✅ **Documentation**:
- ADR-0002: Public GraphQL Caching
- Updated README with new structure
- This implementation guide

## What's Next (To Be Completed)

### Phase 1: Complete Server Endpoints

1. **Create separate GraphQL endpoints**:
   - Refactor `server/src/index.ts` to create two Apollo Server instances
   - `/graphql` - Authenticated with JWT required
   - `/graphql-public` - Public with no auth

2. **Add login endpoint**:
   - `POST /auth/login` - Returns JWT token
   - Hash passwords (bcrypt)
   - Store in MongoDB users collection

3. **Update schema**:
   - Define public query subset
   - Add user authentication to private queries

### Phase 2: Wire Up Demo Components

1. **Add feed queries**:
   - `publicFeed` query for public endpoint
   - `myFeed` query for authenticated endpoint

2. **Implement demo components**:
   - Show side-by-side feed rendering
   - Display cache headers in UI
   - Show APQ hash in network tab

3. **Add login UI**:
   - Simple login form
   - Token storage
   - Logout functionality

### Phase 3: Testing & Validation

1. **Security testing**:
   - Verify no JWT in public requests
   - Test token expiration
   - Audit all public queries

2. **Performance testing**:
   - Measure cache hit rates
   - Compare response times
   - Validate APQ savings

3. **Documentation**:
   - Add usage examples
   - Document cache strategies
   - Security best practices

## Key Files to Modify

### High Priority

1. `server/src/index.ts` - Split into two endpoints
2. `server/src/schema/typeDefs.ts` - Add public queries
3. `server/src/resolvers/index.ts` - Add auth checks
4. `client/src/demos/03-public-caching/PublicCachingDemo.tsx` - Complete demo

### Medium Priority

5. Create `server/src/endpoints/graphql-auth.ts`
6. Create `server/src/endpoints/graphql-public.ts`
7. Create `server/src/auth/login.ts`
8. Add feed queries in `client/src/graphql/queries.ts`

### Low Priority

9. Add tests for auth flow
10. Add monitoring/metrics
11. Create deployment guide

## Quick Commands

```bash
# Install dependencies (already done)
npm install

# Start dev servers
npm run dev

# Test client (once implemented)
cd client && npm test

# Test server (once implemented)
cd server && npm test
```

## Testing the Demo

Once fully implemented:

1. Navigate to "🌐 Public Caching" in the UI
2. Click "Login as Demo User" to authenticate
3. Open DevTools → Network tab
4. Observe:
   - Authenticated: POST with Authorization header
   - Public: GET with query hash, no auth header
5. Check response headers for `cache-control`
6. Reload page - public queries should be cached

## Security Checklist

Before deploying:

- [ ] Verify JWT secret is environment variable
- [ ] No JWT tokens in public endpoint requests
- [ ] Cache-Control headers set correctly
- [ ] Public schema doesn't expose PII
- [ ] Rate limiting on login endpoint
- [ ] HTTPS in production
- [ ] Token expiration tested
- [ ] CORS configured properly

## Resources

- **ADR-0002**: Full architectural decisions and rationale
- **Apollo APQ Docs**: https://www.apollographql.com/docs/apollo-server/performance/apq/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

## Questions or Issues?

Refer to:
1. ADR-0002 for architectural decisions
2. ADR-0001 for existing patterns (DataLoader, etc.)
3. Apollo documentation for client/server APIs

---

**Status**: Infrastructure Phase Complete ✅  
**Next**: Implement server endpoints and complete demo  
**Updated**: December 8, 2025
