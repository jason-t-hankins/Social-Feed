import { useState, useEffect, useRef } from 'react';
import { useQuery, useFragment, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * Approach Comparison Test
 * 
 * This page compares two architectural approaches:
 * 
 * APPROACH 1: UseFragment (Client Cache Optimization)
 * - Fragment colocation
 * - Fine-grained cache subscriptions
 * - Component-level re-render control
 * 
 * APPROACH 2: HTTP Batch + DataLoader (Network & Server Optimization)
 * - HTTP request batching on client
 * - Database query batching on server
 * - Traditional props passing
 * 
 * Both approaches work with the same data but optimize different layers.
 */

// Shared fragments for both approaches
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
    author {
      ...UserBasic
    }
  }
  ${USER_FRAGMENT}
`;

// Query for getting posts
const GET_POSTS_QUERY = gql`
  query GetPosts($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          ...PostBasic
        }
      }
    }
  }
  ${POST_FRAGMENT}
`;

// Type definitions
interface Author {
  __typename: string;
  id: string;
  displayName: string;
  avatarUrl: string;
}

interface Post {
  __typename: string;
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  author: Author;
}

interface FeedEdge {
  node: Post;
}

interface FeedData {
  feed: {
    edges: FeedEdge[];
  };
}

interface PerformanceMetrics {
  approach: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  httpRequests: number;
  componentRenders: number;
  cacheReads: number;
}

// Approach 1: UseFragment - Component with cache subscription
function PostCardWithFragment({ post }: { readonly post: Post }) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  // useFragment reads from cache using the post reference
  const { data, complete } = useFragment({
    fragment: POST_FRAGMENT,
    from: {
      __typename: post.__typename,
      id: post.id,
    },
    fragmentName: 'PostBasic',
  });

  if (!complete || !data) {
    console.log(`[UseFragment] PostCard incomplete - using fallback`);
    // Fallback to props if fragment not in cache
    return (
      <div style={{ 
        padding: '16px', 
        marginBottom: '12px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '2px solid #2196f3'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <img 
            src={post.author.avatarUrl} 
            alt={post.author.displayName}
            style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
          />
          <strong>{post.author.displayName}</strong>
        </div>
        <p style={{ margin: '8px 0' }}>{post.content}</p>
        <div style={{ fontSize: '12px', color: '#666' }}>
          ❤️ {post.likeCount} | 💬 {post.commentCount}
          <span style={{ float: 'right', color: '#2196f3', fontWeight: 'bold' }}>
            Renders: {renderCountRef.current} (fallback)
          </span>
        </div>
      </div>
    );
  }

  console.log(`[UseFragment] PostCard rendered ${renderCountRef.current} times`);

  return (
    <div style={{ 
      padding: '16px', 
      marginBottom: '12px', 
      backgroundColor: '#e3f2fd', 
      borderRadius: '8px',
      border: '2px solid #2196f3'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <img 
          src={data.author.avatarUrl} 
          alt={data.author.displayName}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
        />
        <strong>{data.author.displayName}</strong>
      </div>
      <p style={{ margin: '8px 0' }}>{data.content}</p>
      <div style={{ fontSize: '12px', color: '#666' }}>
        ❤️ {data.likeCount} | 💬 {data.commentCount}
        <span style={{ float: 'right', color: '#2196f3', fontWeight: 'bold' }}>
          Renders: {renderCountRef.current}
        </span>
      </div>
    </div>
  );
}

// Approach 2: Props - Traditional component with props
function PostCardWithProps({ post }: { readonly post: Post }) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  console.log(`[Props] PostCard rendered ${renderCountRef.current} times`);

  return (
    <div style={{ 
      padding: '16px', 
      marginBottom: '12px', 
      backgroundColor: '#fff3e0', 
      borderRadius: '8px',
      border: '2px solid #ff9800'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <img 
          src={post.author.avatarUrl} 
          alt={post.author.displayName}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
        />
        <strong>{post.author.displayName}</strong>
      </div>
      <p style={{ margin: '8px 0' }}>{post.content}</p>
      <div style={{ fontSize: '12px', color: '#666' }}>
        ❤️ {post.likeCount} | 💬 {post.commentCount}
        <span style={{ float: 'right', color: '#ff9800', fontWeight: 'bold' }}>
          Renders: {renderCountRef.current}
        </span>
      </div>
    </div>
  );
}

// Test scenario for Approach 1: UseFragment
function Approach1Test({ 
  postCount,
  onMetrics 
}: { 
  readonly postCount: number;
  readonly onMetrics: (metrics: PerformanceMetrics) => void;
}) {
  const [metrics] = useState<PerformanceMetrics>({
    approach: 'UseFragment (Client Cache)',
    startTime: Date.now(),
    httpRequests: 0,
    componentRenders: 0,
    cacheReads: 0,
  });

  const { data, loading, error } = useQuery<FeedData>(GET_POSTS_QUERY, {
    variables: { first: postCount },
  });

  useEffect(() => {
    if (data) {
      const endTime = Date.now();
      onMetrics({
        ...metrics,
        endTime,
        duration: endTime - metrics.startTime,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Loading with useFragment...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div>
      <h3 style={{ color: '#2196f3' }}>Approach 1: UseFragment</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Fragment colocation + cache subscriptions
      </p>
      {data.feed.edges.map((edge: FeedEdge) => (
        <PostCardWithFragment 
          key={edge.node.id} 
          post={edge.node}
        />
      ))}
    </div>
  );
}

// Test scenario for Approach 2: HTTP Batch + DataLoader
function Approach2Test({ 
  postCount,
  onMetrics,
  useBatching 
}: { 
  readonly postCount: number;
  readonly onMetrics: (metrics: PerformanceMetrics) => void;
  readonly useBatching: boolean;
}) {
  const [metrics] = useState<PerformanceMetrics>({
    approach: 'HTTP Batch + DataLoader (Network/Server)',
    startTime: Date.now(),
    httpRequests: 0,
    componentRenders: 0,
    cacheReads: 0,
  });

  const { data, loading, error } = useQuery<FeedData>(GET_POSTS_QUERY, {
    variables: { first: postCount },
  });

  useEffect(() => {
    if (data) {
      const endTime = Date.now();
      onMetrics({
        ...metrics,
        endTime,
        duration: endTime - metrics.startTime,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Loading with {useBatching ? 'HTTP batching' : 'no batching'}...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;
  if (!data?.feed?.edges) return null;

  return (
    <div>
      <h3 style={{ color: '#ff9800' }}>Approach 2: HTTP Batch + DataLoader</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        ⚡ {useBatching ? 'HTTP batching enabled' : 'No HTTP batching'} + server DataLoader
      </p>
      {data.feed.edges.map((edge: FeedEdge) => (
        <PostCardWithProps 
          key={edge.node.id} 
          post={edge.node}
        />
      ))}
    </div>
  );
}

export function ApproachComparisonPage() {
  const [results, setResults] = useState<PerformanceMetrics[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [postCount, setPostCount] = useState(5);
  const [showComparison, setShowComparison] = useState(false);

  // Create Apollo Clients (memoized to prevent recreation)
  const fragmentClient = useRef(
    new ApolloClient({
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
      cache: new InMemoryCache(),
    })
  ).current;

  const batchClient = useRef(
    new ApolloClient({
      link: new BatchHttpLink({
        uri: 'http://localhost:4000/graphql',
        batchMax: 10,
        batchInterval: 20,
      }),
      cache: new InMemoryCache(),
    })
  ).current;

  const handleMetrics = (metrics: PerformanceMetrics) => {
    setResults((prev) => [...prev, metrics]);
  };

  const startComparison = () => {
    console.clear();
    console.log(' Starting Approach Comparison Test');
    console.log(` Loading ${postCount} posts with each approach`);
    console.log('');
    console.log(' WATCH FOR:');
    console.log('   - Network tab: HTTP request count');
    console.log('   - Console: Component render counts');
    console.log('   - Server logs: DataLoader batching');
    setResults([]);
    setTestRunning(true);
    setShowComparison(true);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>Approach Comparison: UseFragment vs HTTP Batch + DataLoader</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Compare two architectural approaches for GraphQL optimization
        </p>
      </header>

      {/* Explanation */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '24px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <h2>What's Being Compared?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h3 style={{ color: '#2196f3', margin: '0 0 12px 0' }}>Approach 1: UseFragment</h3>
            <ul style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <li><strong>Layer:</strong> Client cache optimization</li>
              <li><strong>Technique:</strong> Fragment colocation + cache subscriptions</li>
              <li><strong>Benefit:</strong> Fine-grained re-render control</li>
              <li><strong>Best for:</strong> Complex UIs with frequent updates</li>
            </ul>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
            <h3 style={{ color: '#ff9800', margin: '0 0 12px 0' }}>Approach 2: HTTP Batch + DataLoader</h3>
            <ul style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <li><strong>Layer:</strong> Network + Server optimization</li>
              <li><strong>Technique:</strong> HTTP batching + database batching</li>
              <li><strong>Benefit:</strong> Fewer HTTP requests + no N+1 queries</li>
              <li><strong>Best for:</strong> Reducing network/database load</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>Run Comparison Test</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <label>
            Number of posts:{' '}
            <input
              type="number"
              value={postCount}
              onChange={(e) => setPostCount(Number(e.target.value))}
              min={1}
              max={20}
              disabled={testRunning}
              style={{
                marginLeft: '8px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '80px',
              }}
            />
          </label>
          <button
            onClick={startComparison}
            disabled={testRunning}
            style={{
              padding: '12px 24px',
              backgroundColor: testRunning ? '#ccc' : '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: testRunning ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {testRunning ? ' Testing...' : '▶ Start Comparison'}
          </button>
        </div>
      </div>

      {/* Side-by-side comparison */}
      {showComparison && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <ApolloProvider client={fragmentClient}>
              <Approach1Test postCount={postCount} onMetrics={handleMetrics} />
            </ApolloProvider>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <ApolloProvider client={batchClient}>
              <Approach2Test postCount={postCount} onMetrics={handleMetrics} useBatching={true} />
            </ApolloProvider>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h2>Test Results</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Approach</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Duration (ms)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={`${result.approach}-${result.startTime}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{result.approach}</td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: result.duration && result.duration < 500 ? '#28a745' : '#ffc107'
                  }}>
                    {result.duration ?? 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
