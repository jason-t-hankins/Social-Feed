import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { authenticatedClient, publicClient } from '../../apollo-configs';
import { useAuth } from '../../auth';

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
              onClick={() => login('demo', 'demo')} 
              style={{ marginLeft: '16px', padding: '4px 12px' }}
            >
              Login as Demo User
            </button>
          </>
        )}
      </div>

      {/* Demo Controls */}
      <div style={{ marginBottom: '24px' }}>
        <strong>View: </strong>
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

      {/* Instructions */}
      <div style={{
        padding: '16px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        marginBottom: '24px',
      }}>
        <h3>🔍 How to Test Public Caching</h3>
        <ol style={{ marginLeft: '20px' }}>
          <li>Open DevTools → Network tab</li>
          <li>Filter by "graphql"</li>
          <li>Observe the differences:
            <ul>
              <li><strong>Authenticated:</strong> POST requests with Authorization header</li>
              <li><strong>Public:</strong> GET requests with query hash (APQ), no auth header</li>
            </ul>
          </li>
          <li>Check Response Headers for <code>cache-control</code></li>
          <li>Reload page - public queries should hit cache!</li>
        </ol>
      </div>

      {/* Demo Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeDemo === 'both' ? '1fr 1fr' : '1fr',
        gap: '24px',
      }}>
        {(activeDemo === 'authenticated' || activeDemo === 'both') && (
          <ApolloProvider client={authenticatedClient}>
            <div style={{
              padding: '24px',
              backgroundColor: '#fff',
              border: '2px solid #ff6b6b',
              borderRadius: '12px',
            }}>
              <h2>🔒 Authenticated Feed</h2>
              <p style={{ color: '#666' }}>
                Includes JWT token - NOT publicly cacheable
              </p>
              <div style={{
                padding: '12px',
                backgroundColor: '#fff5f5',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginTop: '16px',
              }}>
                Authorization: Bearer eyJhbGc...
              </div>
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#999' }}>
                Feed content would appear here (to be implemented)
              </p>
            </div>
          </ApolloProvider>
        )}

        {(activeDemo === 'public' || activeDemo === 'both') && (
          <ApolloProvider client={publicClient}>
            <div style={{
              padding: '24px',
              backgroundColor: '#fff',
              border: '2px solid #51cf66',
              borderRadius: '12px',
            }}>
              <h2>🌍 Public Feed</h2>
              <p style={{ color: '#666' }}>
                No auth token - CDN/ISP cacheable
              </p>
              <div style={{
                padding: '12px',
                backgroundColor: '#f0fff4',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginTop: '16px',
              }}>
                GET /graphql-public?extensions=...
              </div>
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#999' }}>
                Public feed content would appear here (to be implemented)
              </p>
            </div>
          </ApolloProvider>
        )}
      </div>

      {/* Key Findings Section */}
      <div style={{
        marginTop: '48px',
        padding: '24px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
      }}>
        <h2>📊 Key Findings & Trade-offs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div>
            <h3>✅ Benefits of Public Caching</h3>
            <ul>
              <li>Reduced server load (CDN serves cached responses)</li>
              <li>Faster response times (edge caching)</li>
              <li>Lower bandwidth costs</li>
              <li>Better scalability for high-traffic public content</li>
            </ul>
          </div>
          <div>
            <h3>⚠️ Trade-offs & Considerations</h3>
            <ul>
              <li>Cannot use HTTP batching (GET requests required)</li>
              <li>Requires separate endpoints (auth vs public)</li>
              <li>APQ setup adds complexity</li>
              <li>Cache invalidation strategy needed</li>
              <li>Risk of token leakage if not careful</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
