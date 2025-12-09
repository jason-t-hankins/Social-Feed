import { useState } from 'react';
import { ApolloProvider, useQuery, useMutation } from '@apollo/client';
import { authenticatedClient, publicClient } from '../../apollo-configs';
import { useAuth } from '../../auth';
import { GET_FEED, GET_PUBLIC_FEED } from '../../graphql/queries';
import { LIKE_POST } from '../../graphql/mutations';
import { PostCard } from '../../components';

/**
 * Public Caching Demo Page
 * 
 * Demonstrates the differences between authenticated and public GraphQL queries
 * for enabling CDN/ISP caching.
 * 
 * Key Concepts:
 * - Authenticated queries include JWT tokens (not cacheable publicly)
 * - Public queries have no auth headers (CDN/ISP cacheable)
 * - Separate endpoints prevent accidental token leakage
 * - APQ (Automatic Persisted Queries) reduces request size
 * 
 * This demo shows:
 * 1. Side-by-side comparison of authenticated vs public queries
 * 2. Cache-Control headers in Network tab
 * 3. APQ hash-based requests
 * 4. Performance implications of public caching
 */

export function PublicCachingDemoPage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [activeDemo, setActiveDemo] = useState<'authenticated' | 'public' | 'both'>('both');

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>🌐 Public Caching Demo</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
        Exploring GraphQL query caching for CDNs and network providers
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
            Not authenticated
            <button 
              onClick={() => login('alice', 'demo')} 
              style={{ marginLeft: '16px', padding: '4px 12px' }}
            >
              Login as Alice
            </button>
          </>
        )}
      </div>

      {/* Demo Controls */}
      <div style={{ marginBottom: '24px' }}>
        <strong>View: </strong>{' '}
        <button
          onClick={() => setActiveDemo('authenticated')}
          style={{
            padding: '8px 16px',
            marginLeft: '8px',
            backgroundColor: activeDemo === 'authenticated' ? '#007bff' : '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Authenticated Only
        </button>
        <button
          onClick={() => setActiveDemo('public')}
          style={{
            padding: '8px 16px',
            marginLeft: '8px',
            backgroundColor: activeDemo === 'public' ? '#007bff' : '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Public Only
        </button>
        <button
          onClick={() => setActiveDemo('both')}
          style={{
            padding: '8px 16px',
            marginLeft: '8px',
            backgroundColor: activeDemo === 'both' ? '#007bff' : '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Side-by-Side
        </button>
      </div>

      {/* Demo Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeDemo === 'both' ? '1fr 1fr' : '1fr',
        gap: '24px',
      }}>
        {(activeDemo === 'authenticated' || activeDemo === 'both') && (
          <ApolloProvider client={authenticatedClient}>
            <AuthenticatedFeed />
          </ApolloProvider>
        )}

        {(activeDemo === 'public' || activeDemo === 'both') && (
          <ApolloProvider client={publicClient}>
            <PublicFeed />
          </ApolloProvider>
        )}
      </div>
    </div>
  );
}

/**
 * Authenticated Feed Component
 * Uses the authenticated Apollo Client with JWT
 */
function AuthenticatedFeed() {
  const { user, login } = useAuth();
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
      <h2>Authenticated Feed</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Requires authentication for access
      </p>
      <div style={{
        padding: '12px',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        marginBottom: '8px',
        wordBreak: 'break-all',
      }}>
        POST /graphql<br />
        {user?.id 
          ? `Authorization: Bearer ${localStorage.getItem('auth_token')?.substring(0, 20)}...`
          : '(Authentication required)'}
      </div>

      {!user?.id ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          backgroundColor: '#fff5f5',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '18px', marginBottom: '16px', color: '#d63031' }}>
            🔐 Authentication Required
          </p>
          <p style={{ marginBottom: '24px', color: '#666' }}>
            You must be logged in to view the authenticated feed and interact with posts.
          </p>
          <button
            onClick={() => login('alice', 'demo')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            Login to View
          </button>
        </div>
      ) : (
        <>
          {loading && <p>Loading authenticated feed...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
          {data?.feed?.edges && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                Showing {data.feed.edges.length} of {data.feed.totalCount} posts
              </p>
              {data.feed.edges.map(({ node }: any) => (
                <PostCard 
                  key={node.id} 
                  post={node} 
                  isInteractive={true}
                  onLikeClick={handleLikeClick}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Public Feed Component
 * Uses the public Apollo Client (no auth, APQ enabled)
 */
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
      <h2>Public Feed</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        View-only mode - No interactions available
      </p>
      <div style={{
        padding: '12px',
        backgroundColor: '#f0fff4',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        marginBottom: '8px',
        wordBreak: 'break-all',
      }}>
        GET /graphql-public<br />
        (No Authorization header - APQ enabled)
      </div>

      {loading && <p>Loading public feed...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {data?.publicFeed?.edges && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Showing {data.publicFeed.edges.length} of {data.publicFeed.totalCount} posts
          </p>
          {data.publicFeed.edges.map(({ node }: any) => (
            <PostCard 
              key={node.id} 
              post={node}
              isInteractive={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
