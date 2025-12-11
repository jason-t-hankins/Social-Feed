import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';

/**
 * Public Apollo Client Configuration
 * 
 * This client is designed for public, unauthenticated queries that can be cached
 * by CDNs and network providers (e.g., Comcast, ISPs).
 * 
 * Key characteristics:
 * - NO authentication headers (JWT)
 * - Automatic Persisted Queries (APQ) enabled
 * - Uses GET requests for APQ (enables HTTP caching)
 * - Separate endpoint to prevent auth leakage
 * 
 * Compatible with:
 * - Public CDN caching (Cloudflare, Fastly, etc.)
 * - ISP caching (Comcast, etc.)
 * - Browser HTTP cache
 * 
 * Trade-offs:
 * - HTTP batching NOT available (GET requests)
 * - Only for non-sensitive, public data
 * - Requires server-side APQ support
 */

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql-public',
});

// Enable Automatic Persisted Queries
// Sends query hash instead of full query string, reducing request size
// Using crypto-hash for SHA256 hashing
const persistedQueryLink = createPersistedQueryLink({ 
  sha256: async (data) => {
    // Use crypto-hash dynamically
    const { sha256: hash } = await import('crypto-hash');
    return hash(data);
  },
  useGETForHashedQueries: true, // This makes the link use GET for hashed queries
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Public feed has different cache policy
        publicFeed: {
          keyArgs: false,
          merge(existing, incoming, { args }) {
            if (!args?.after) {
              return incoming;
            }
            return {
              ...incoming,
              edges: [...(existing?.edges || []), ...incoming.edges],
            };
          },
        },
      },
    },
    User: {
      keyFields: ['id'],
    },
  },
});

export const publicClient = new ApolloClient({
  clientAwareness: {
    name: 'Section-2-Public-Cache', // 🎯 Easy to find in DevTools!
    version: '1.0',
  },
  link: persistedQueryLink.concat(httpLink),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
  devtools: {
    enabled: true,
  },
});
