import { useState, useRef } from 'react';
import { useQuery, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * HTTP Batching Demo - REAL PERFORMANCE WIN
 * 
 * This demonstrates HTTP batching's network optimization:
 * When multiple components independently fetch data, batching combines
 * all those separate requests into ONE HTTP request.
 * 
 * WITHOUT batching: 5 unique queries = 5 HTTP requests
 * WITH batching: 5 unique queries = 1 HTTP request (with 5 operations inside)
 * 
 * 📊 Open DevTools Network tab to see the difference!
 */

// Independent queries that different components might make
const GET_POSTS_QUERY = gql`
  query GetPosts1($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          likeCount
        }
      }
    }
  }
`;

const GET_POSTS_QUERY_2 = gql`
  query GetPosts2($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          commentCount
        }
      }
    }
  }
`;

const GET_POSTS_QUERY_3 = gql`
  query GetPosts3($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          author {
            displayName
          }
        }
      }
    }
  }
`;

const GET_POSTS_QUERY_4 = gql`
  query GetPosts4($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          author {
            avatarUrl
          }
        }
      }
    }
  }
`;

const GET_POSTS_QUERY_5 = gql`
  query GetPosts5($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          createdAt
        }
      }
    }
  }
`;

// Widget components that independently fetch data
function Widget1() {
  const { data, loading } = useQuery(GET_POSTS_QUERY, {
    variables: { first: 2 },
  });

  if (loading) return <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Widget 1: Likes</h4>
      {data.feed.edges.slice(0, 2).map((edge: any) => (
        <div key={edge.node.id} style={{ fontSize: '14px' }}>
          ❤️ {edge.node.likeCount}
        </div>
      ))}
    </div>
  );
}

function Widget2() {
  const { data, loading } = useQuery(GET_POSTS_QUERY_2, {
    variables: { first: 2 },
  });

  if (loading) return <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px', marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Widget 2: Comments</h4>
      {data.feed.edges.slice(0, 2).map((edge: any) => (
        <div key={edge.node.id} style={{ fontSize: '14px' }}>
          💬 {edge.node.commentCount}
        </div>
      ))}
    </div>
  );
}

function Widget3() {
  const { data, loading } = useQuery(GET_POSTS_QUERY_3, {
    variables: { first: 2 },
  });

  if (loading) return <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px', marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Widget 3: Authors</h4>
      {data.feed.edges.slice(0, 2).map((edge: any) => (
        <div key={edge.node.id} style={{ fontSize: '14px' }}>
          👤 {edge.node.author.displayName}
        </div>
      ))}
    </div>
  );
}

function Widget4() {
  const { data, loading } = useQuery(GET_POSTS_QUERY_4, {
    variables: { first: 2 },
  });

  if (loading) return <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div style={{ padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Widget 4: Avatars</h4>
      {data.feed.edges.slice(0, 2).map((edge: any) => (
        <div key={edge.node.id} style={{ fontSize: '14px' }}>
          🖼️ {edge.node.author.avatarUrl.substring(0, 30)}...
        </div>
      ))}
    </div>
  );
}

function Widget5() {
  const { data, loading } = useQuery(GET_POSTS_QUERY_5, {
    variables: { first: 2 },
  });

  if (loading) return <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div style={{ padding: '12px', backgroundColor: '#fff9c4', borderRadius: '8px', marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Widget 5: Timestamps</h4>
      {data.feed.edges.slice(0, 2).map((edge: any) => (
        <div key={edge.node.id} style={{ fontSize: '14px' }}>
          🕐 {new Date(edge.node.createdAt).toLocaleTimeString()}
        </div>
      ))}
    </div>
  );
}

// Dashboard with multiple independent widgets
function Dashboard({ title }: { readonly title: string }) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  return (
    <div>
      <h3>{title}</h3>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
        Component renders: {renderCountRef.current}
      </p>
      <Widget1 />
      <Widget2 />
      <Widget3 />
      <Widget4 />
      <Widget5 />
    </div>
  );
}

export function BatchingDemoPage() {
  const [testRun, setTestRun] = useState(0);

  // Create Apollo Clients
  const noBatchClient = useRef(
    new ApolloClient({
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
      cache: new InMemoryCache(),
    })
  ).current;

  const batchClient = useRef(
    new ApolloClient({
      link: new BatchHttpLink({
        uri: 'http://localhost:4000/graphql',
        batchMax: 20,
        batchInterval: 10,
      }),
      cache: new InMemoryCache(),
    })
  ).current;

  const runTest = () => {
    console.clear();
    console.log('🚀 HTTP Batching Test Starting');
    console.log('📊 Open Network tab and filter by "graphql"');
    console.log('');
    setTestRun(prev => prev + 1);
    
    // Track requests
    setTimeout(() => {
      console.log('✅ Test complete! Check Network tab:');
      console.log('   - WITHOUT batching: Should see 5 separate requests');
      console.log('   - WITH batching: Should see 1 request (batched)');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>HTTP Batching Performance Demo</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          See the real power of HTTP batching with multiple independent queries
        </p>
      </header>

      {/* Explanation */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
        <h2 style={{ marginTop: 0 }}>💡 What This Demonstrates</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          <strong>Scenario:</strong> A dashboard with 5 independent widgets, each making its own GraphQL query.
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li><strong>WITHOUT batching:</strong> 5 separate HTTP requests = more overhead, slower load</li>
          <li><strong>WITH batching:</strong> 1 HTTP request containing all 5 operations = faster!</li>
        </ul>
        <p style={{ fontSize: '14px', marginTop: '16px', fontWeight: 'bold' }}>
          📌 HTTP batching shines when you have MULTIPLE INDEPENDENT QUERIES executing at the same time.
        </p>
      </div>

      {/* Test Button */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <button
          onClick={runTest}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          ▶️ Run Test (Open Network Tab First!)
        </button>
      </div>

      {/* Side-by-side comparison */}
      {testRun > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #f44336' }}>
            <ApolloProvider client={noBatchClient}>
              <Dashboard title="❌ WITHOUT Batching" />
            </ApolloProvider>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
              <strong>Expected: 5 HTTP requests</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Check Network tab for multiple "graphql" requests</div>
            </div>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #4caf50' }}>
            <ApolloProvider client={batchClient}>
              <Dashboard title="✅ WITH Batching" />
            </ApolloProvider>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <strong>Expected: 1 HTTP request (batched)</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Check Network tab - one request with array payload</div>
            </div>
          </div>
        </div>
      )}

      {/* DevTools Guide */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
        <h2>📊 How to Observe the Difference</h2>
        <ol style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li><strong>Open DevTools</strong> → Network tab</li>
          <li><strong>Filter by "graphql"</strong> in the search box</li>
          <li><strong>Click "Run Test"</strong> button above</li>
          <li><strong>Watch the requests:</strong>
            <ul>
              <li>Left side (red): You'll see 5 separate HTTP requests</li>
              <li>Right side (green): You'll see 1 HTTP request with an array in the payload</li>
            </ul>
          </li>
          <li><strong>Click on the batched request</strong> → Preview/Payload tab to see the array of operations</li>
        </ol>
      </div>

      {/* When to Use */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
        <h2>🎯 When HTTP Batching Really Helps</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#c3e6cb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Scenario</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Batching Benefit</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Dashboard with 10+ independent widgets</td>
              <td style={{ padding: '12px', textAlign: 'center', fontSize: '24px' }}>✅✅✅</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Admin panel with multiple data tables</td>
              <td style={{ padding: '12px', textAlign: 'center', fontSize: '24px' }}>✅✅✅</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Mobile app on slow network (HTTP/1.1)</td>
              <td style={{ padding: '12px', textAlign: 'center', fontSize: '24px' }}>✅✅</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Single page with one query</td>
              <td style={{ padding: '12px', textAlign: 'center', fontSize: '24px' }}>❌</td>
            </tr>
            <tr>
              <td style={{ padding: '12px' }}>Modern app with HTTP/2</td>
              <td style={{ padding: '12px', textAlign: 'center', fontSize: '24px' }}>⚠️</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
