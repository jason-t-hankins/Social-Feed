import { useState, useEffect, useRef } from 'react';
import { useQuery, useFragment, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * Approach Comparison Test - Isolated Tests + Rapid-Fire Demo
 * 
 * This page demonstrates:
 * 1. Individual isolated tests for each approach (fresh cache, independent clients)
 * 2. Rapid-fire query demo showing batching in action with queries in quick succession
 * 
 * 4 APPROACHES:
 * 1. Props + HttpLink (Baseline - no client optimizations)
 * 2. Props + BatchHttpLink (HTTP batching only)
 * 3. UseFragment + HttpLink (Cache subscriptions only)
 * 4. UseFragment + BatchHttpLink (Both optimizations)
 * 
 * NOTE: DataLoader runs on the server for ALL tests (always required for production).
 * This test focuses on CLIENT-SIDE optimization patterns only.
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

// Test scenario component
function TestScenario({ 
  postCount,
  onMetrics,
  useFragmentHook,
  label,
  color,
  description
}: { 
  readonly postCount: number;
  readonly onMetrics: (metrics: PerformanceMetrics) => void;
  readonly useFragmentHook: boolean;
  readonly label: string;
  readonly color: string;
  readonly description: string;
}) {
  const [metrics] = useState<PerformanceMetrics>({
    approach: label,
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

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;
  if (!data?.feed?.edges) return null;

  const PostCard = useFragmentHook ? PostCardWithFragment : PostCardWithProps;

  return (
    <div>
      <h3 style={{ color, margin: '0 0 8px 0' }}>{label}</h3>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
        {description}
      </p>
      {data.feed.edges.map((edge: FeedEdge) => (
        <PostCard 
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

  // Create Apollo Clients for 2x2 matrix (memoized to prevent recreation)
  const httpClient = useRef(
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
        <h1>2x2 Matrix: Client-Side Optimization Patterns</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Compare all combinations of useFragment and HTTP batching
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
        <p style={{ marginBottom: '16px', fontSize: '15px' }}>
          <strong>Note:</strong> DataLoader runs on the server for ALL tests (always required). 
          This comparison focuses on <strong>client-side patterns only</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #9e9e9e' }}>
            <h3 style={{ color: '#9e9e9e', margin: '0 0 8px 0', fontSize: '16px' }}>1. Props + HttpLink</h3>
            <p style={{ fontSize: '13px', margin: 0, color: '#666' }}>Baseline - no client optimizations</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '2px solid #ff9800' }}>
            <h3 style={{ color: '#ff9800', margin: '0 0 8px 0', fontSize: '16px' }}>2. Props + BatchHttpLink</h3>
            <p style={{ fontSize: '13px', margin: 0, color: '#666' }}>HTTP batching only</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '2px solid #2196f3' }}>
            <h3 style={{ color: '#2196f3', margin: '0 0 8px 0', fontSize: '16px' }}>3. UseFragment + HttpLink</h3>
            <p style={{ fontSize: '13px', margin: 0, color: '#666' }}>Cache subscriptions only</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '2px solid #4caf50' }}>
            <h3 style={{ color: '#4caf50', margin: '0 0 8px 0', fontSize: '16px' }}>4. UseFragment + BatchHttpLink</h3>
            <p style={{ fontSize: '13px', margin: 0, color: '#666' }}>Both optimizations combined</p>
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
              max={100}
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

      {/* 2x2 Grid comparison */}
      {showComparison && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {/* Row 1: HttpLink */}
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #9e9e9e' }}>
            <ApolloProvider client={httpClient}>
              <TestScenario 
                postCount={postCount} 
                onMetrics={handleMetrics}
                useFragmentHook={false}
                label="1. Props + HttpLink"
                color="#9e9e9e"
                description="Baseline (no client optimizations)"
              />
            </ApolloProvider>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #ff9800' }}>
            <ApolloProvider client={batchClient}>
              <TestScenario 
                postCount={postCount} 
                onMetrics={handleMetrics}
                useFragmentHook={false}
                label="2. Props + BatchHttpLink"
                color="#ff9800"
                description="HTTP batching only"
              />
            </ApolloProvider>
          </div>

          {/* Row 2: UseFragment */}
          <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #2196f3' }}>
            <ApolloProvider client={httpClient}>
              <TestScenario 
                postCount={postCount} 
                onMetrics={handleMetrics}
                useFragmentHook={true}
                label="3. UseFragment + HttpLink"
                color="#2196f3"
                description="Cache subscriptions only"
              />
            </ApolloProvider>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #4caf50' }}>
            <ApolloProvider client={batchClient}>
              <TestScenario 
                postCount={postCount} 
                onMetrics={handleMetrics}
                useFragmentHook={true}
                label="4. UseFragment + BatchHttpLink"
                color="#4caf50"
                description="Both optimizations"
              />
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
