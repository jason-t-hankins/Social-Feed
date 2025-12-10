import { useQuery, ApolloProvider } from '@apollo/client';
import { useEffect } from 'react';
import { useAuth } from '../../auth';
import { GET_FEED_WITH_ANALYTICS } from '../../graphql/permissionQueries';
import { authenticatedClient } from '../../apollo-configs/authenticated';

/**
 * Permission-Aware Caching Demo
 * 
 * Demonstrates server-side in-memory caching that respects user permissions.
 * 
 * Key Concepts:
 * - Cache keys include user role/permissions
 * - Admin users see analytics data, regular users don't
 * - Same query, different data based on permissions
 * - Server-side cache prevents unauthorized data access
 */

export function PermissionCacheDemoPage() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <ApolloProvider client={authenticatedClient}>
      <PermissionCacheDemoContent 
        isAuthenticated={isAuthenticated}
        user={user}
        login={login}
        logout={logout}
      />
    </ApolloProvider>
  );
}

function PermissionCacheDemoContent({ 
  isAuthenticated, 
  user, 
  login, 
  logout 
}: { 
  isAuthenticated: boolean;
  user: { username: string; id: string; role: 'admin' | 'user' } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}) {

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1> Permission-Aware Server-Side Memory Caching</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
        Server-side caching that respects user permissions and field-level access control in memory
      </p>

      {/* Authentication Status */}
      <div style={{
        padding: '16px',
        backgroundColor: isAuthenticated ? '#d4edda' : '#fff3cd',
        border: `2px solid ${isAuthenticated ? '#28a745' : '#ffc107'}`,
        borderRadius: '8px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <strong>Current User:</strong>
          {isAuthenticated && user ? (
            <>
              <span style={{ 
                padding: '4px 12px', 
                backgroundColor: user.role === 'admin' ? '#dc3545' : '#6c757d',
                color: 'white',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}>
                {user.username} ({user.role})
              </span>
              <button onClick={logout} style={{ padding: '6px 16px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <span>Not authenticated</span>
              <button onClick={() => login('alice', 'demo')} style={{ padding: '6px 16px', marginRight: '8px' }}>
                Login as Alice (Admin)
              </button>
              <button onClick={() => login('bob', 'demo')} style={{ padding: '6px 16px' }}>
                Login as Bob (User)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feed Display */}
      {isAuthenticated ? (
        <FeedWithAnalytics />
      ) : (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6',
        }}>
          <h3 style={{ color: '#6c757d' }}>🔒 Authentication Required</h3>
          <p style={{ color: '#6c757d', marginBottom: '16px' }}>
            Login as Alice (admin) or Bob (user) to see the difference in data access
          </p>
        </div>
      )}

      {/* How It Works */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
      }}>
        <h2>How Permission-Aware Caching Works</h2>
        
        <div style={{ marginTop: '16px' }}>
          <h3>1. Cache Key Generation</h3>
          <pre style={{ 
            padding: '12px', 
            backgroundColor: '#fff', 
            borderRadius: '6px',
            overflow: 'auto',
          }}>{`const cacheKey = {
  query: 'GetFeedWithAnalytics',
  variables: { first: 5 },
  userId: user.id,
  role: user.role,  // ⚡ Key differentiator!
};
// Generates: "GetFeedWithAnalytics::{"first":5}::alice::admin::[]"`}</pre>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h3>2. Permission Check in Resolver</h3>
          <pre style={{ 
            padding: '12px', 
            backgroundColor: '#fff', 
            borderRadius: '6px',
            overflow: 'auto',
          }}>{`Post: {
  analytics: async (parent, _, { user }) => {
    // Only admins see analytics
    if (user?.role !== 'admin') {
      return null;
    }
    return fetchAnalytics(parent.id);
  }
}`}</pre>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h3>3. Separate Cache Entries</h3>
          <ul>
            <li><strong>Admin cache:</strong> Contains full post data + analytics</li>
            <li><strong>User cache:</strong> Contains post data without analytics</li>
            <li><strong>Result:</strong> No way for regular users to access cached admin data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function FeedWithAnalytics() {
  const { user } = useAuth();
  const { loading, error, data, refetch } = useQuery(GET_FEED_WITH_ANALYTICS, {
    variables: { first: 5 },
    fetchPolicy: 'cache-and-network', // Always fetch from network to get fresh data
  });

  // Refetch when user changes (logout/login)
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user?.id, user?.role, refetch]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div style={{
        padding: '16px',
        backgroundColor: isAdmin ? '#fff3cd' : '#d1ecf1',
        border: `2px solid ${isAdmin ? '#ffc107' : '#17a2b8'}`,
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <strong>{isAdmin ? '👑 Admin View' : '👤 User View'}</strong>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
          {isAdmin 
            ? 'You can see analytics data for each post (viewCount, engagementRate, etc.)'
            : 'You see posts but no analytics - that field returns null for your role'
          }
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data?.feed?.edges?.map(({ node }: any) => (
          <div 
            key={node.id}
            style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <img 
                src={node.author.avatarUrl} 
                alt={node.author.displayName}
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              />
              <div>
                <strong>{node.author.displayName}</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  @{node.author.username}
                </div>
              </div>
            </div>

            <p style={{ margin: '12px 0' }}>{node.content}</p>

            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              fontSize: '14px', 
              color: '#666',
              paddingTop: '12px',
              borderTop: '1px solid #eee',
            }}>
              <span>💬 {node.commentCount} comments</span>
              <span>❤️ {node.likeCount} likes</span>
            </div>

            {/* Analytics Section - Only visible to admins */}
            {node.analytics && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fff9c4',
                border: '2px solid #fbc02d',
                borderRadius: '6px',
              }}>
                <strong style={{ color: '#f57c00' }}>📊 Analytics (Admin Only)</strong>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: '8px',
                  fontSize: '13px',
                }}>
                  <div>
                    <div style={{ color: '#666' }}>Views</div>
                    <strong>{node.analytics.viewCount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Avg. Time</div>
                    <strong>{node.analytics.avgTimeSpent}s</strong>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Engagement</div>
                    <strong>{(node.analytics.engagementRate * 100).toFixed(1)}%</strong>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Top Countries</div>
                    <strong>{node.analytics.topCountries.join(', ')}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Indicator when analytics is null */}
            {!node.analytics && user?.role === 'user' && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                border: '1px dashed #dee2e6',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#666',
              }}>
                📊 Analytics field: <code>null</code> (requires admin role)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
