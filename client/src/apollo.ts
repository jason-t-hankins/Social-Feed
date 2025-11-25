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
const USE_BATCHING = typeof import.meta !== 'undefined' && 
  import.meta.env?.VITE_USE_BATCHING === 'true';

/**
 * Apollo Client Cache Configuration
 * 
 * The InMemoryCache normalizes and caches GraphQL data.
 * Fragments read directly from this normalized cache.
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
  },
});

export const apolloClient = new ApolloClient({
  link: USE_BATCHING ? batchHttpLink : httpLink,
  cache,
  connectToDevTools: true,
});

// Re-export for convenience
export { ApolloProvider };
