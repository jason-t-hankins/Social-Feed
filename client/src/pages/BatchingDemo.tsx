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
 * WITH batching: 5 unique queries = 2-3 HTTP requests (operations batched together)
 * 
 *  Open DevTools Network tab to see the difference!
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
        batchInterval: 40,
      }),
      cache: new InMemoryCache(),
    })
  ).current;

  const runTest = () => {
    console.clear();
    console.log(' HTTP Batching Test Starting');
    console.log(' Open Network tab and filter by "graphql"');
    console.log('');
    setTestRun(prev => prev + 1);
    
    // Track requests
    setTimeout(() => {
      console.log(' Test complete! Check Network tab:');
      console.log('   - WITHOUT batching: Should see 5 separate requests');
      console.log('   - WITH batching: Should see 2-3 requests (batched + preflight/metadata)');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>HTTP Batching Performance Demo</h1>
      </header>

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
          ▶ Run Test
        </button>
      </div>

      {/* Side-by-side comparison */}
      {testRun > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #f44336' }}>
            <ApolloProvider client={noBatchClient}>
              <Dashboard title=" WITHOUT Batching" />
            </ApolloProvider>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
              <strong>Expected: 5 HTTP requests</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Check Network tab for multiple "graphql" requests</div>
            </div>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #4caf50' }}>
            <ApolloProvider client={batchClient}>
              <Dashboard title=" WITH Batching" />
            </ApolloProvider>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <strong>Expected: 2-3 HTTP requests (batched payload + preflight)</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Check Network tab - one request with array payload</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
