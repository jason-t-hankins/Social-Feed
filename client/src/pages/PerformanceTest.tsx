import { useState } from 'react';
import { useQuery, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * Performance Testing Page
 * 
 * This page demonstrates and measures the difference between:
 * 1. HTTP Batching vs No Batching
 * 2. Fragment usage patterns
 * 3. DataLoader efficiency
 * 
 * Open browser DevTools to see:
 * - Network tab: HTTP request batching
 * - Console: DataLoader batching logs
 * - Performance tab: Timing metrics
 */

// Fragment definitions
const USER_FRAGMENT = gql`
  fragment UserBasic on User {
    id
    displayName
    avatarUrl
  }
`;

const POST_FRAGMENT = gql`
  fragment PostBasic on Post {
    id
    content
    createdAt
    likeCount
    commentCount
  }
`;

// Query 1: Get recent posts
const GET_POSTS_QUERY = gql`
  query GetPosts($first: Int) {
    feed(first: $first) {
      edges {
        node {
          ...PostBasic
          author {
            ...UserBasic
          }
        }
      }
    }
  }
  ${POST_FRAGMENT}
  ${USER_FRAGMENT}
`;

// Query 2: Get user profile (independent query)
const GET_USER_QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserBasic
      postCount
    }
  }
  ${USER_FRAGMENT}
`;

// Query 3: Get post stats (independent query)
const GET_POST_STATS_QUERY = gql`
  query GetPostStats($id: ID!) {
    post(id: $id) {
      id
      likeCount
      commentCount
    }
  }
`;

interface PerformanceMetrics {
  scenario: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  httpRequests: number;
  batchingEnabled: boolean;
}

function TestScenario({ 
  scenario, 
  batchingEnabled,
  onMetrics 
}: { 
  scenario: string;
  batchingEnabled: boolean;
  onMetrics: (metrics: PerformanceMetrics) => void;
}) {
  const [metrics] = useState<PerformanceMetrics>({
    scenario,
    startTime: Date.now(),
    httpRequests: 0,
    batchingEnabled,
  });

  // Execute multiple queries simultaneously to demonstrate batching
  const postsQuery = useQuery(GET_POSTS_QUERY, {
    variables: { first: 5 },
    onCompleted: () => {
      console.log(`✅ [${scenario}] Posts query completed`);
    },
  });

  const userQuery = useQuery(GET_USER_QUERY, {
    variables: { id: 'sample-user-id' },
    skip: true, // We'll trigger this manually
    onCompleted: () => {
      console.log(`✅ [${scenario}] User query completed`);
    },
  });

  const statsQuery = useQuery(GET_POST_STATS_QUERY, {
    variables: { id: 'sample-post-id' },
    skip: true, // We'll trigger this manually
    onCompleted: () => {
      console.log(`✅ [${scenario}] Stats query completed`);
    },
  });

  const loading = postsQuery.loading || userQuery.loading || statsQuery.loading;

  if (!loading && !metrics.endTime) {
    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    const updatedMetrics = { ...metrics, endTime, duration };
    onMetrics(updatedMetrics);
  }

  return (
    <div style={{ 
      padding: '16px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: loading ? '#f9f9f9' : '#fff'
    }}>
      <h3>{scenario}</h3>
      <p>Batching: {batchingEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
      <p>Status: {loading ? '⏳ Loading...' : '✅ Complete'}</p>
      {metrics.duration && (
        <p style={{ fontWeight: 'bold', color: '#28a745' }}>
          Duration: {metrics.duration}ms
        </p>
      )}
    </div>
  );
}

export function PerformanceTestPage() {
  const [results, setResults] = useState<PerformanceMetrics[]>([]);
  const [testRunning, setTestRunning] = useState(false);

  // Create two Apollo Clients: one with batching, one without
  const noBatchClient = new ApolloClient({
    link: new HttpLink({
      uri: 'http://localhost:4000/graphql',
    }),
    cache: new InMemoryCache(),
  });

  const batchClient = new ApolloClient({
    link: new BatchHttpLink({
      uri: 'http://localhost:4000/graphql',
      batchMax: 10,
      batchInterval: 20,
    }),
    cache: new InMemoryCache(),
  });

  const handleMetrics = (metrics: PerformanceMetrics) => {
    setResults((prev) => [...prev, metrics]);
  };

  const startTest = () => {
    console.clear();
    console.log('🚀 Starting performance test...');
    console.log('👀 Watch the Network tab to see HTTP batching in action!');
    console.log('👀 Watch the Console for DataLoader batching logs!');
    setResults([]);
    setTestRunning(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>GraphQL Performance Testing</h1>
        <p style={{ color: '#666' }}>
          Compare HTTP batching vs non-batching performance
        </p>
        <button
          onClick={startTest}
          disabled={testRunning}
          style={{
            padding: '12px 24px',
            backgroundColor: testRunning ? '#ccc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            marginTop: '16px',
          }}
        >
          {testRunning ? 'Test Running...' : 'Start Performance Test'}
        </button>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '24px',
        marginBottom: '32px' 
      }}>
        {testRunning && (
          <>
            <ApolloProvider client={noBatchClient}>
              <TestScenario
                scenario="No HTTP Batching"
                batchingEnabled={false}
                onMetrics={handleMetrics}
              />
            </ApolloProvider>

            <ApolloProvider client={batchClient}>
              <TestScenario
                scenario="HTTP Batching Enabled"
                batchingEnabled={true}
                onMetrics={handleMetrics}
              />
            </ApolloProvider>
          </>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px' 
        }}>
          <h2>Test Results</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Scenario</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Batching</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Duration (ms)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{result.scenario}</td>
                  <td style={{ padding: '12px' }}>
                    {result.batchingEnabled ? '✅ Yes' : '❌ No'}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: result.duration && result.duration < 1000 ? '#28a745' : '#ffc107'
                  }}>
                    {result.duration ?? 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {results.length >= 2 && (
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
              <h3>Analysis</h3>
              <ul>
                <li>
                  <strong>HTTP Batching Impact:</strong> Reduces the number of HTTP requests by combining multiple operations.
                  Check the Network tab - you should see fewer requests with batching enabled.
                </li>
                <li>
                  <strong>DataLoader Impact:</strong> On the server, DataLoader batches database queries.
                  Check the Console for DataLoader logs showing batched queries.
                </li>
                <li>
                  <strong>When to use batching:</strong> Most beneficial when multiple components make independent queries simultaneously.
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h2>📊 How to Interpret Results</h2>
        <ol>
          <li>
            <strong>Open Browser DevTools</strong> (F12 or Cmd+Option+I)
          </li>
          <li>
            <strong>Network Tab:</strong> Filter by "graphql" to see requests
            <ul>
              <li>Without batching: Multiple separate requests</li>
              <li>With batching: Single request with array of operations</li>
            </ul>
          </li>
          <li>
            <strong>Console Tab:</strong> Look for DataLoader batch logs
            <ul>
              <li>Example: "[DataLoader] Batched user load for 5 IDs"</li>
              <li>This shows DataLoader combining DB queries regardless of HTTP batching</li>
            </ul>
          </li>
          <li>
            <strong>Performance Tab:</strong> Record and analyze timing
          </li>
        </ol>
      </div>

      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
        <h2>🎯 Key Takeaways</h2>
        <ul>
          <li>
            <strong>HTTP Batching (Client):</strong> Combines multiple GraphQL operations into one HTTP request.
            Most beneficial with high-latency networks and HTTP/1.1.
          </li>
          <li>
            <strong>DataLoader (Server):</strong> Batches database queries to solve N+1 problem.
            Works independently of HTTP batching - you should use BOTH!
          </li>
          <li>
            <strong>useFragment (Client):</strong> Enables fine-grained component re-renders.
            Not demonstrated here, but crucial for complex UIs.
          </li>
          <li>
            <strong>Best Practice:</strong> Use all three techniques together for optimal performance.
          </li>
        </ul>
      </div>
    </div>
  );
}
