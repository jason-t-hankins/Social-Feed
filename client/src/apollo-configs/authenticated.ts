import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * Authenticated Apollo Client Configuration
 * 
 * This client includes JWT authentication in all requests.
 * Should be used for user-specific, private queries that require authentication.
 * 
 * Key characteristics:
 * - Includes Authorization header with JWT token
 * - Uses HTTP batching (multiple queries in one request)
 * - Cache includes user-specific data
 * - NOT suitable for public/CDN caching
 */

const batchLink = new BatchHttpLink({
  uri: 'http://localhost:4000/graphql',
  batchMax: 10, // Maximum number of queries to batch
  batchInterval: 20, // Wait 20ms to collect queries before sending
});

// Middleware to add auth token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const cache = new InMemoryCache({
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
    },
  },
});

export const authenticatedClient = new ApolloClient({
  link: from([authLink, batchLink]),
  cache,
  devtools: {
    enabled: true,
  },
});
