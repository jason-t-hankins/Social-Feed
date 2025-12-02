import { useQuery, gql } from '@apollo/client';
import { useState, useEffect } from 'react';

/**
 * DataLoader Batching Visualization
 * 
 * This page demonstrates how DataLoader batches database queries
 * on the server side to solve the N+1 problem.
 * 
 * Open the browser console and server logs to see:
 * - Individual resolver calls (many)
 * - Batched database queries (few)
 */

const GET_FEED_WITH_AUTHORS = gql`
  query GetFeedWithAuthors($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          author {
            id
            displayName
            avatarUrl
          }
          commentCount
          likeCount
        }
      }
    }
  }
`;

const GET_NESTED_DATA = gql`
  query GetNestedData($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          author {
            id
            displayName
          }
          comments {
            id
            content
            author {
              id
              displayName
            }
          }
        }
      }
    }
  }
`;

interface LogEntry {
  timestamp: string;
  type: 'resolver' | 'dataloader' | 'database';
  message: string;
}

export function DataLoaderVisualizationPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scenario, setScenario] = useState<'basic' | 'nested' | null>(null);
  const [postCount, setPostCount] = useState(5);

  // Intercept console.log to capture server logs
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      const message = args.join(' ');
      if (message.includes('[DataLoader]') || message.includes('[Resolver]')) {
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            type: message.includes('[DataLoader]') ? 'dataloader' : 'resolver',
            message,
          },
        ]);
      }
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const basicQuery = useQuery(GET_FEED_WITH_AUTHORS, {
    variables: { first: postCount },
    skip: scenario !== 'basic',
    onCompleted: () => {
      console.log('✅ Basic query completed');
    },
  });

  const nestedQuery = useQuery(GET_NESTED_DATA, {
    variables: { first: postCount },
    skip: scenario !== 'nested',
    onCompleted: () => {
      console.log('✅ Nested query completed');
    },
  });

  const query = scenario === 'basic' ? basicQuery : nestedQuery;

  const startBasicTest = () => {
    console.clear();
    setLogs([]);
    console.log('🚀 Starting Basic DataLoader Test');
    console.log(`📊 Loading ${postCount} posts with authors`);
    console.log('👀 Watch for DataLoader batching!');
    setScenario('basic');
  };

  const startNestedTest = () => {
    console.clear();
    setLogs([]);
    console.log('🚀 Starting Nested DataLoader Test');
    console.log(`📊 Loading ${postCount} posts with authors and comments (with their authors)`);
    console.log('👀 Watch for multiple DataLoader batches!');
    setScenario('nested');
  };

  const resetTest = () => {
    setScenario(null);
    setLogs([]);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>DataLoader Batching Visualization</h1>
        <p style={{ color: '#666' }}>
          See how DataLoader batches database queries to solve the N+1 problem
        </p>
      </header>

      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h2>🎓 The N+1 Problem</h2>
        <p>Without DataLoader:</p>
        <pre style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
{`Query 1: Get 10 posts
Query 2: Get author for post 1
Query 3: Get author for post 2
...
Query 11: Get author for post 10
Total: 11 database queries 😱`}
        </pre>
        <p>With DataLoader:</p>
        <pre style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
{`Query 1: Get 10 posts
Query 2: Get authors WHERE id IN [1,2,3,4,5,6,7,8,9,10]
Total: 2 database queries 🎉`}
        </pre>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2>Test Configuration</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <label>
            Number of posts:
            <input
              type="number"
              value={postCount}
              onChange={(e) => setPostCount(Number(e.target.value))}
              min={1}
              max={20}
              style={{
                marginLeft: '8px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '80px',
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={startBasicTest}
            disabled={scenario === 'basic' && query.loading}
            style={{
              padding: '12px 24px',
              backgroundColor: scenario === 'basic' ? '#28a745' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity: scenario === 'basic' && query.loading ? 0.6 : 1,
            }}
          >
            Test Basic (Posts + Authors)
          </button>

          <button
            onClick={startNestedTest}
            disabled={scenario === 'nested' && query.loading}
            style={{
              padding: '12px 24px',
              backgroundColor: scenario === 'nested' ? '#28a745' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity: scenario === 'nested' && query.loading ? 0.6 : 1,
            }}
          >
            Test Nested (Posts + Comments + Authors)
          </button>

          {scenario && (
            <button
              onClick={resetTest}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {query.loading && (
        <div style={{ padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '24px' }}>
          <p>⏳ Loading data... Watch the console for DataLoader batching!</p>
        </div>
      )}

      {query.error && (
        <div style={{ padding: '24px', backgroundColor: '#f8d7da', borderRadius: '8px', marginBottom: '24px' }}>
          <p style={{ color: '#721c24' }}>Error: {query.error.message}</p>
        </div>
      )}

      {query.data && (
        <div style={{ marginBottom: '32px' }}>
          <h2>Query Results</h2>
          <div style={{ padding: '16px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
            <p>✅ Successfully loaded {query.data.feed.edges.length} posts</p>
            <p>Check the logs below to see how DataLoader batched the queries!</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Expected behavior */}
        <div style={{ padding: '24px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
          <h3>📋 Expected DataLoader Behavior</h3>
          
          {scenario === 'basic' && (
            <div>
              <p><strong>Basic Query (Posts + Authors):</strong></p>
              <ol>
                <li>Load {postCount} posts from database</li>
                <li>Identify {postCount} unique author IDs</li>
                <li><strong>DataLoader batches:</strong> Load all authors in 1 query</li>
                <li>Total: ~2 database queries</li>
              </ol>
            </div>
          )}

          {scenario === 'nested' && (
            <div>
              <p><strong>Nested Query (Posts + Comments + Authors):</strong></p>
              <ol>
                <li>Load {postCount} posts</li>
                <li><strong>DataLoader batch 1:</strong> Load all post authors</li>
                <li><strong>DataLoader batch 2:</strong> Load comments for all posts</li>
                <li><strong>DataLoader batch 3:</strong> Load all comment authors</li>
                <li>Total: ~4-5 database queries (vs 100+ without batching!)</li>
              </ol>
            </div>
          )}

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
            <strong>Key Concepts:</strong>
            <ul style={{ fontSize: '14px' }}>
              <li>DataLoader collects all IDs within a tick</li>
              <li>Makes single query with IN clause</li>
              <li>Returns results in correct order</li>
              <li>Per-request caching prevents duplicate loads</li>
            </ul>
          </div>
        </div>

        {/* Right: Console logs */}
        <div style={{ padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>📊 DataLoader Logs</h3>
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              padding: '12px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            {logs.length === 0 ? (
              <p style={{ color: '#666' }}>No logs yet. Start a test to see DataLoader in action!</p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: log.type === 'dataloader' ? '#d4edda' : '#fff3cd',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${log.type === 'dataloader' ? '#28a745' : '#ffc107'}`,
                  }}
                >
                  <span style={{ color: '#666', fontSize: '10px' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <br />
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
        <h2>🎯 Key Takeaways</h2>
        <ul>
          <li>
            <strong>Always use DataLoader</strong> for any GraphQL server that loads related entities.
          </li>
          <li>
            <strong>Create per-request:</strong> New DataLoader instances for each GraphQL request.
          </li>
          <li>
            <strong>Automatic batching:</strong> DataLoader collects loads within a single event loop tick.
          </li>
          <li>
            <strong>Works with HTTP batching:</strong> DataLoader (server) and HTTP batching (client) are complementary.
          </li>
          <li>
            <strong>Essential for performance:</strong> Without DataLoader, you'll hit the N+1 problem on every nested query.
          </li>
        </ul>
      </div>
    </div>
  );
}
