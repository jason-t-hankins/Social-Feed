import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useMutation, from, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useAuth } from '../../auth';
import { GET_FEED, GET_PUBLIC_FEED } from '../../graphql/queries';
import { LIKE_POST } from '../../graphql/mutations';
import { PostCard } from '../../components';

/**
 * Conditional Auth Demo - Alternative Approach (Not Recommended)
 * 
 * This demo shows how you COULD use a single endpoint with conditional auth,
 * but highlights why this approach was rejected in favor of separate endpoints.
 * 
 * Key Concepts:
 * - Conditional auth headers based on operation name
 * - Same endpoint for both authenticated and public queries
 * - Why this pattern is risky and not recommended
 */

// Create a client that conditionally adds auth based on operation
const createConditionalClient = (hasToken: boolean) => {
  const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
  });

  // This context link checks operation name and conditionally adds auth
  const conditionalAuthLink = setContext((operation, { headers }) => {
    // List of operations that should include auth
    const authenticatedOperations = ['GetFeed', 'GetPost', 'MyProfile', 'CreatePost', 'LikePost'];
    
    // Check if this operation should be authenticated
    const shouldAuthenticate = authenticatedOperations.includes(operation.operationName || '');
    
    // Only add auth header for authenticated operations
    if (shouldAuthenticate && hasToken) {
      const token = localStorage.getItem('auth_token');
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : '',
        },
      };
    }

    // For public operations, explicitly remove any auth headers
    // AND add X-Public-Query header to signal the server to add cache headers
    return {
      headers: {
        ...headers,
        authorization: undefined,
        'X-Public-Query': 'true', // Signal to server: this is a public query
      },
    };
  });

  return new ApolloClient({
    link: from([conditionalAuthLink, httpLink]),
    cache: new InMemoryCache(),
  });
};

export function ConditionalAuthDemoPage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const client = createConditionalClient(isAuthenticated);

  return (
    <ApolloProvider client={client}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1> Conditional Auth Demo (On same endpoint)</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          Single endpoint with conditional authentication
        </p>


        {/* Authentication Status */}
        <div style={{
          padding: '16px',
          backgroundColor: isAuthenticated ? '#d4edda' : '#fff3cd',
          border: `1px solid ${isAuthenticated ? '#c3e6cb' : '#ffeaa7'}`,
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <strong>Authentication Status: </strong>
          {isAuthenticated ? (
            <>
              Logged in as {user?.username}
              <button onClick={logout} style={{ marginLeft: '16px', padding: '4px 12px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              Not authenticated{' '}
              <button
                onClick={() => login('alice', 'demo')} 
                style={{ marginLeft: '16px', padding: '4px 12px' }}
              >
                Login as Alice
              </button>
            </>
          )}
        </div>

        {/* How It Works */}
        <div style={{
          padding: '16px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff', 
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}>
            <pre style={{ margin: 0 }}>{`const shouldAuthenticate = 
                authenticatedOperations.includes(operationName);

                if (shouldAuthenticate) {
                headers.authorization = "Bearer ...";
                } else {
                headers.authorization = undefined;
                headers['X-Public-Query'] = 'true'; // Signal server
                }`}
            </pre>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}>
          <AuthenticatedFeed />
          <PublicFeed />
        </div>

        {/* Key Problems */}
        <div style={{
          marginTop: '24px',
          padding: '24px',
          backgroundColor: '#f8d7da',
          border: '2px solid #f5c6cb',
          borderRadius: '12px',
        }}>
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#fff',
            borderRadius: '8px',
          }}>
            <h3 style={{ marginTop: 0 }}>How Separate Endpoints Fix this Implementation's Problems</h3>
            <ul style={{ marginBottom: 0 }}>
              <li><strong>Physical Separation:</strong> Impossible to accidentally cache auth requests</li>
              <li><strong>Clear Intent:</strong> Endpoint choice makes auth requirement obvious</li>
              <li><strong>Easy Audit:</strong> Monitor /graphql-public for any auth headers (should be zero)</li>
              <li><strong>Simple CDN:</strong> Cache everything from /graphql-public, nothing from /graphql</li>
              <li><strong>Type Safety:</strong> Different clients = compile-time enforcement</li>
            </ul>
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
}

function AuthenticatedFeed() {
  const { user } = useAuth();
  const { loading, error, data, refetch } = useQuery(GET_FEED, {
    variables: { first: 5 },
    skip: !user?.id,
  });

  const [likePost] = useMutation(LIKE_POST, {
    onCompleted: () => {
      refetch();
    },
    onError: (err) => {
      alert(`Error liking post: ${err.message}`);
    },
  });

  const handleLikeClick = (postId: string) => {
    if (!user?.id) {
      alert('Please login to like posts');
      return;
    }
    likePost({
      variables: {
        postId,
        userId: user.id,
      },
    });
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fff',
      border: '2px solid #ff6b6b',
      borderRadius: '12px',
      minHeight: '400px',
    }}>
      <h2>🔒 Authenticated Feed</h2>
      <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
        Operation: <code>GetFeed</code> (in whitelist)
      </p>
      <div style={{
        padding: '12px',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        marginBottom: '16px',
        wordBreak: 'break-all',
      }}>
        POST /graphql<br />
        {user?.id 
          ? `Authorization: Bearer ${localStorage.getItem('auth_token')?.substring(0, 20)}...`
          : '(Login required)'}
      </div>

      {user?.id ? (
        <>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
          {data?.feed?.edges && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                Showing {data.feed.edges.length} of {data.feed.totalCount} posts
              </p>
              {data.feed.edges.map(({ node }: any) => (
                <PostCard key={node.id} post={node} isInteractive={true} onLikeClick={handleLikeClick} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          backgroundColor: '#fff5f5',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '18px', marginBottom: '16px', color: '#d63031' }}>
            🔐 Authentication Required
          </p>
          <p style={{ color: '#666' }}>Login to view authenticated feed</p>
        </div>
      )}
    </div>
  );
}

function PublicFeed() {
  const { loading, error, data } = useQuery(GET_PUBLIC_FEED, {
    variables: { first: 5 },
  });

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fff',
      border: '2px solid #51cf66',
      borderRadius: '12px',
      minHeight: '400px',
    }}>
      <h2>🌍 Public Feed</h2>
      <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
        Operation: <code>GetPublicFeed</code> (NOT in whitelist)
      </p>
      <div style={{
        padding: '12px',
        backgroundColor: '#f0fff4',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        marginBottom: '16px',
        wordBreak: 'break-all',
      }}>
        POST /graphql<br />
        (Auth header explicitly removed by conditional logic)
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {data?.publicFeed?.edges && (
        <div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Showing {data.publicFeed.edges.length} of {data.publicFeed.totalCount} posts
          </p>
          {data.publicFeed.edges.map(({ node }: any) => (
            <PostCard key={node.id} post={node} isInteractive={false} />
          ))}
        </div>
      )}
    </div>
  );
}
