import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * Apollo Client Configuration
 * 
 * This configuration demonstrates HTTP batching on the client side.
 * HTTP batching combines multiple GraphQL operations into a single HTTP request.
 * 
 * When to use HTTP Batching:
 * - Multiple independent queries in quick succession
 * - Reduces HTTP overhead (connection setup, headers)
 * - Useful when components independently fetch data
 * 
 * Trade-offs:
 * - Slight delay to batch requests together
 * - All batched queries fail/succeed together
 * - May not be beneficial with HTTP/2 multiplexing
 */

// Standard HTTP link - one request per operation
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Batched HTTP link - combines operations into single request
// Note: Apollo Server 4 supports batching out of the box
const batchHttpLink = new BatchHttpLink({
  uri: 'http://localhost:4000/graphql',
  batchMax: 10, // Maximum operations to batch
  batchInterval: 20, // Wait up to 20ms to batch
});

// Use environment variable to toggle batching
const USE_BATCHING = import.meta.env?.VITE_USE_BATCHING === 'true';

/**
 * Apollo Client Cache Configuration
 * 
 * The InMemoryCache normalizes and caches GraphQL data.
 * Fragments read directly from this normalized cache.
 * 
 * Field Policies demonstrate client-side cache security:
 * - Sensitive fields (SSN) are always masked
 * - Prevents accidental exposure in cache inspector or logs
 */
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Merge paginated feed results
        feed: {
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
    // Ensure User objects are properly identified by cache
    User: {
      keyFields: ['id'],
      fields: {
        /**
         * SSN Field Policy: NEVER expose SSN in client cache
         * 
         * Even if the server accidentally returns SSN data, the client
         * will mask it. This is a defense-in-depth security measure.
         * 
         * Use cases:
         * - Sensitive PII (SSN, credit cards, passwords)
         * - Data that should never be cached (OTPs, tokens)
         * - Fields that vary by permission but share cache key
         */
        ssn: {
          read() {
            // Always return redacted value, never expose real SSN
            return '***-**-****';
          },
        },
      },
    },
  },
});

export const apolloClient = new ApolloClient({
  clientAwareness: {
    name: 'Section-1-Main', // 🎯 Easy to find in DevTools!
    version: '1.0',
  },
  link: USE_BATCHING ? batchHttpLink : httpLink,
  cache,
  devtools: {
    enabled: true,
  },
});

/**
 * Authenticated Apollo Client for cache demo
 * Uses cache-first policy by default to demonstrate client caching
 */
export const createAuthenticatedClient = (token: string) => {
  const authLink = new HttpLink({
    uri: 'http://localhost:4000/graphql',
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });

  return new ApolloClient({
    clientAwareness: {
      name: 'OLD-Auth-Client', // 🎯 Easy to find in DevTools!
      version: '1.0',
    },
    link: authLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            feed: {
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
          fields: {
            ssn: {
              read() {
                return '***-**-****';
              },
            },
          },
        },
        Post: {
          keyFields: ['id'],
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-first', // Default: read from cache when available
      },
      query: {
        fetchPolicy: 'cache-first',
      },
    },
    devtools: {
      enabled: true,
    },
  });
};

// Re-export for convenience
export { ApolloProvider };
