import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

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
  // Use GET for APQ to enable HTTP caching
  useGETForQueries: true,
});

// Enable Automatic Persisted Queries
// Sends query hash instead of full query string, reducing request size
const persistedQueryLink = createPersistedQueryLink({ 
  sha256,
  useGETForHashedQueries: true,
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
  link: persistedQueryLink.concat(httpLink),
  cache,
  devtools: {
    enabled: true,
  },
});
