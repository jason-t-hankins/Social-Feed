import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

/**
 * Authenticated Apollo Client Configuration
 * 
 * This client includes JWT authentication in all requests.
 * Should be used for user-specific, private queries that require authentication.
 * 
 * Key characteristics:
 * - Includes Authorization header with JWT token
 * - Cache includes user-specific data
 * - NOT suitable for public/CDN caching
 */

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
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
  link: from([authLink, httpLink]),
  cache,
  devtools: {
    enabled: true,
  },
});
