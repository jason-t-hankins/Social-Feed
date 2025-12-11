import { useState } from 'react';
import { useQuery, gql, ApolloProvider } from '@apollo/client';
import { authenticatedClient } from '../../apollo-configs/authenticated';
import { useAuth } from '../../auth/AuthContext';

/**
 * Section 4: Client-Side Caching with Apollo Client
 * 
 * Simplified demo focused on the key requirements:
 * 1. Varying field selections and cache merge behavior
 * 2. Public vs private data caching strategies
 * 3. Cache inspection with Apollo DevTools
 * 4. Field-level security (SSN masking)
 */

// Queries with different field selections
const GET_USER_CARD = gql`
  query GetUserCard($id: ID!) {
    user(id: $id) {
      id
      displayName
      avatarUrl
    }
  }
`;

const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      displayName
      avatarUrl
      username
      createdAt
      postCount
    }
  }
`;

const GET_USER_SENSITIVE = gql`
  query GetUserSensitive($id: ID!) {
    user(id: $id) {
      id
      displayName
      username
      ssn
    }
  }
`;

const GET_FEED_PUBLIC = gql`
  query GetFeedPublic($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          createdAt
        }
      }
    }
  }
`;

function VaryingFieldsDemo({ userId }: { readonly userId: string }) {
  const [queryType, setQueryType] = useState<'none' | 'card' | 'profile'>('none');

  const card = useQuery(GET_USER_CARD, {
    variables: { id: userId },
    skip: queryType !== 'card',
    fetchPolicy: 'cache-first',
  });

  const profile = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: queryType !== 'profile',
    fetchPolicy: 'cache-first',
  });

  return (
    <div style={{ 
      border: '2px solid #007bff', 
      borderRadius: '12px', 
      padding: '24px', 
      backgroundColor: '#fff',
      marginBottom: '24px'
    }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#007bff' }}>
        1. Varying Field Selections & Cache Merge
      </h3>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Query the same user with different field selections. Watch how Apollo merges data into one cache entry.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setQueryType('profile')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: queryType === 'profile' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          1. Query: Full Profile (6 fields)
        </button>
        <button
          onClick={() => setQueryType('card')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: queryType === 'card' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          2. Query: Minimal Card (3 fields)
        </button>
      </div>

      {card.loading && <div style={{ color: '#ffc107' }}>⏳ Loading card...</div>}
      {profile.loading && <div style={{ color: '#ffc107' }}>⏳ Loading profile...</div>}

      {card.data?.user && queryType === 'card' && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#007bff' }}>Minimal Card Data:</h4>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <div>• id: {card.data.user.id}</div>
            <div>• displayName: {card.data.user.displayName}</div>
            <div>• avatarUrl: {card.data.user.avatarUrl}</div>
          </div>
        </div>
      )}

      {profile.data?.user && queryType === 'profile' && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#28a745' }}>Full Profile Data:</h4>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <div>• id: {profile.data.user.id}</div>
            <div>• displayName: {profile.data.user.displayName}</div>
            <div>• avatarUrl: {profile.data.user.avatarUrl}</div>
            <div>• username: {profile.data.user.username}</div>
            <div>• createdAt: {profile.data.user.createdAt}</div>
            <div>• postCount: {profile.data.user.postCount}</div>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px'
      }}>
        <h4 style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
          🔍 Apollo DevTools Inspection Steps:
        </h4>
        <ol style={{ fontSize: '14px', color: '#666', margin: 0, paddingLeft: '20px' }}>
          <li>Open Apollo DevTools (browser extension) + Network tab</li>
          <li>Click "1. Query: Full Profile" → See <strong>1 network request</strong>, cache has 6 fields</li>
          <li>Click "2. Query: Minimal Card" → <strong>No network request!</strong> Reads 3 fields from cache</li>
          <li>Check Apollo DevTools Cache tab → <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>User:{userId}</code> has all 6 fields</li>
          <li>💡 <strong>Key insight</strong>: Query the superset first, then subsets read from cache for free!</li>
        </ol>
      </div>
    </div>
  );
}

function FieldMaskingDemo({ userId }: { readonly userId: string }) {
  const [showData, setShowData] = useState(false);

  const { data, loading } = useQuery(GET_USER_SENSITIVE, {
    variables: { id: userId },
    skip: !showData,
    fetchPolicy: 'network-only', // Sensitive data: always fresh
  });

  return (
    <div style={{ 
      border: '2px solid #dc3545', 
      borderRadius: '12px', 
      padding: '24px', 
      backgroundColor: '#fff',
      marginBottom: '24px'
    }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#dc3545' }}>
        2. Field-Level Security & Cache Masking
      </h3>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Uses <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>network-only</code> to always fetch fresh data. 
        The SSN field is masked by a field policy - even if cached, it shows <code>***-**-****</code>.
      </p>

      <button
        onClick={() => setShowData(!showData)}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        {showData ? 'Hide' : 'Fetch'} Sensitive Data
      </button>

      {loading && <div style={{ color: '#ffc107' }}>⏳ Loading...</div>}

      {data?.user && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f8d7da',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#721c24' }}>User Data with SSN field:</h4>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <div>• displayName: {data.user.displayName}</div>
            <div>• username: {data.user.username}</div>
            <div style={{ color: '#dc3545', fontWeight: 'bold' }}>
              • ssn: {data.user.ssn} ← Always masked by field policy!
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px'
      }}>
        <h4 style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
          🔒 Security Pattern:
        </h4>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          The SSN field has a <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>read()</code> policy 
          in apollo.ts that always returns <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>'***-**-****'</code>.
          Even if the server accidentally sends real SSN data, the client will never expose it.
          <br /><br />
          <strong>Check Apollo DevTools Cache:</strong> The SSN field will show the masked value, not raw data.
        </p>
      </div>
    </div>
  );
}

function CachePolicyDemo() {
  const [showData, setShowData] = useState(true);

  const { data, loading, client } = useQuery(GET_FEED_PUBLIC, {
    variables: { first: 3 },
    fetchPolicy: 'cache-first', // For public data
    skip: !showData,
  });

  const clearCacheAndHide = () => {
    // Clear cache and hide data
    client.cache.evict({ fieldName: 'feed' });
    client.cache.gc();
    setShowData(false);
  };

  return (
    <div style={{ 
      border: '2px solid #28a745', 
      borderRadius: '12px', 
      padding: '24px', 
      backgroundColor: '#fff',
      marginBottom: '24px'
    }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#28a745' }}>
        3. Public vs Private Cache Policies
      </h3>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Public data uses <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>cache-first</code> for instant loading. 
        Watch the Network tab: First "Show Feed" hits network, subsequent clicks read from cache (no network request!).
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowData(!showData)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: showData ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showData ? 'Hide Feed' : 'Show Feed'}
        </button>
        <button
          onClick={clearCacheAndHide}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Cache
        </button>
        {loading && <span style={{ color: '#ffc107' }}>⏳ Loading...</span>}
      </div>

      {data?.feed && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#28a745' }}>Feed Posts:</h4>
          {data.feed.edges.map((edge: any) => (
            <div key={edge.node.id} style={{ 
              padding: '8px', 
              backgroundColor: 'white',
              borderRadius: '4px',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              {edge.node.content}
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        backgroundColor: '#e7f3ff',
        border: '1px solid #007bff',
        borderRadius: '8px'
      }}>
        <h4 style={{ fontWeight: 'bold', color: '#004085', marginBottom: '8px' }}>
          � How to Verify cache-first Behavior:
        </h4>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li>Open DevTools → Network tab (filter: Fetch/XHR)</li>
            <li>Click "Show Feed" → See <strong>1 network request</strong></li>
            <li>Click "Hide Feed" then "Show Feed" again → <strong>No new network request!</strong> (cache hit)</li>
            <li>Click "Clear Cache" then "Show Feed" → See network request again</li>
          </ol>
          <p style={{ marginTop: '12px', fontStyle: 'italic' }}>
            💡 <strong>cache-first</strong>: Product catalogs, blog posts, reference data
            <br />
            💡 <strong>network-only</strong> (Demo 2): Bank balances, private messages, SSN data
          </p>
        </div>
      </div>
    </div>
  );
}

function UseFragmentCachingSection() {
  return (
    <div style={{ 
      border: '2px solid #6f42c1', 
      borderRadius: '12px', 
      padding: '24px', 
      backgroundColor: '#fff',
      marginBottom: '24px'
    }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#6f42c1' }}>
        4. useFragment: Fine-Grained Cache Reactivity
      </h3>
      
      <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#333' }}>
        <p style={{ marginBottom: '16px' }}>
          While <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useQuery</code> is great,{' '}
          <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useFragment</code> provides advanced cache integration:
        </p>

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#6f42c1' }}>✨ Key Benefits:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Automatic Updates:</strong> Component re-renders when <em>any</em> query updates that cache entry - 
              even queries from other components or pages
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Field-Level Reactivity:</strong> Subscribe only to the fields you need. If another component fetches 
              more fields, your component still only updates when <em>your</em> fields change
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Works with Field Policies:</strong> SSN masking (demo above) applies automatically - useFragment reads 
              the <code style={{ backgroundColor: '#fff', padding: '2px 4px' }}>***-**-****</code> from cache
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>No Network Request:</strong> Reads directly from normalized cache - zero network overhead
            </li>
          </ul>
        </div>

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h4 style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
            🎯 Use Case: Multi-Step Forms
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Imagine a user profile editor with 5 tabs (Personal Info, Address, Preferences, Security, Privacy). 
            Each tab uses <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useFragment</code> to read its fields from cache:
          </p>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
            <li>One <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useQuery(GetUser)</code> at the top fetches all data</li>
            <li>Each tab uses <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useFragment</code> to reactively read its subset</li>
            <li>When Security tab updates password, all tabs see latest cached data instantly</li>
            <li>Security tab's SSN field shows <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>***-**-****</code> via field policy</li>
          </ul>
        </div>

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#e7f3ff',
          border: '1px solid #007bff',
          borderRadius: '8px'
        }}>
          <h4 style={{ fontWeight: 'bold', color: '#004085', marginBottom: '8px' }}>
            🔄 Comparison with useQuery:
          </h4>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #007bff' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: '#004085' }}></th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#004085' }}>useQuery</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#004085' }}>useFragment</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Network Request</td>
                <td style={{ padding: '8px' }}>Yes (unless cache-first + cached)</td>
                <td style={{ padding: '8px', color: '#28a745' }}>Never - cache only</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Reactivity</td>
                <td style={{ padding: '8px' }}>Only when query refetches</td>
                <td style={{ padding: '8px', color: '#28a745' }}>Any cache update</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Field Policies</td>
                <td style={{ padding: '8px', color: '#28a745' }}>✅ Applied</td>
                <td style={{ padding: '8px', color: '#28a745' }}>✅ Applied</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Best For</td>
                <td style={{ padding: '8px' }}>Initial data fetch</td>
                <td style={{ padding: '8px' }}>Reading from cache</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
          💡 <strong>Pro Tip:</strong> Combine them! Use <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useQuery</code> once 
          at the top level to fetch data, then <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>useFragment</code> in child 
          components for reactive, field-specific reads. See Section 1 for live examples.
        </p>
      </div>
    </div>
  );
}

// Query to get Alice's real ID
const GET_ALICE = gql`
  query GetAlice {
    userByUsername(username: "alice") {
      id
    }
  }
`;

export function ClientCacheDemo() {
  const { user, login, logout } = useAuth();
  
  // Fetch Alice's real ID from the database (MongoDB ObjectId)
  const { data: aliceData, loading: aliceLoading } = useQuery(GET_ALICE, {
    client: authenticatedClient,
  });

  if (aliceLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading example user ID...</p>
      </div>
    );
  }

  const EXAMPLE_USER_ID = aliceData?.userByUsername?.id;

  if (!EXAMPLE_USER_ID) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
        <p>❌ Error: Could not find example user (alice). Make sure the server is running and seeded.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1>🎯 Client-Side Caching with Apollo Client</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          Simplified demo focused on key caching concepts and tooling proficiency
        </p>

        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6',
        }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
            🔐 Authentication required to access cache demos
          </p>
          <button 
            onClick={() => login('alice', 'demo')} 
            style={{ 
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Login as Alice
          </button>
          <p style={{ fontSize: '14px', color: '#999', marginTop: '12px' }}>
            (All demos use Alice's data)
          </p>
        </div>
      </div>
    );
  }

  return (
    <ApolloProvider client={authenticatedClient}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1>🎯 Client-Side Caching with Apollo Client</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          Simplified demo focused on key caching concepts and tooling proficiency
        </p>

        {/* Authentication Status */}
        <div style={{
          padding: '16px',
          backgroundColor: '#d4edda',
          border: '2px solid #28a745',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <strong>Current User:</strong>
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
          </div>
        </div>

        {/* Prerequisites Banner */}
        <div style={{
          padding: '16px',
          backgroundColor: '#e7f3ff',
          border: '2px solid #007bff',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#007bff' }}>📋 Before You Start:</h3>
          <p style={{ margin: 0, color: '#666' }}>
            <strong>Install Apollo DevTools:</strong>{' '}
            <a href="https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
              Chrome
            </a> | <a href="https://addons.mozilla.org/en-US/firefox/addon/apollo-developer-tools/" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
              Firefox
            </a>
            <br />
            Open DevTools → Apollo tab → Cache tab to inspect normalized cache as you use the demos below.
            <br />
            <strong>Example User ID:</strong> <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>{EXAMPLE_USER_ID}</code> (Alice) - pre-filled in demos
          </p>
        </div>

        <VaryingFieldsDemo userId={EXAMPLE_USER_ID} />
        <FieldMaskingDemo userId={EXAMPLE_USER_ID} />
        <CachePolicyDemo />
        <UseFragmentCachingSection />

        <div style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: '#f8f9fa',
          border: '2px solid #6c757d',
          borderRadius: '12px',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#343a40' }}>
            📚 Key Takeaways & Next Steps
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              ✅ <strong>Normalized Cache:</strong> Apollo merges data from queries with different fields into one cache entry per entity
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✅ <strong>Field Policies:</strong> Sensitive fields can be masked at the cache layer for defense-in-depth security
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✅ <strong>Cache Policies:</strong> Use cache-first for public data, network-only for sensitive data
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✅ <strong>Apollo DevTools:</strong> Essential for inspecting cache structure and debugging cache behavior
            </li>
            <li style={{ marginBottom: '16px' }}>
              ✅ <strong>ADR Documentation:</strong> Read docs/adr/0004-client-side-caching.md for comprehensive patterns
            </li>
            <li style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
              <strong>💡 Pro Tip:</strong> Compare this with Section 3 (server-side caching) to understand full-stack optimization strategy
            </li>
          </ul>
        </div>
      </div>
    </ApolloProvider>
  );
}
