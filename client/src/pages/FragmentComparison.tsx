import { useQuery, useFragment, gql } from '@apollo/client';
import { useState } from 'react';

/**
 * UseFragment Comparison Page
 * 
 * Demonstrates the difference between:
 * 1. Traditional useQuery with prop drilling
 * 2. useFragment for component isolation
 * 
 * Key Observations:
 * - useFragment enables components to re-render only when their data changes
 * - Fragment colocation keeps data requirements with components
 * - Better performance for complex UIs with many updates
 */

// Fragment definitions
const POST_STATS_FRAGMENT = gql`
  fragment PostStatsData on Post {
    id
    likeCount
    commentCount
  }
`;

const POST_CONTENT_FRAGMENT = gql`
  fragment PostContentData on Post {
    id
    content
    createdAt
    author {
      id
      displayName
      avatarUrl
    }
  }
`;

// Complete post query
const GET_POST_QUERY = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      ...PostContentData
      ...PostStatsData
    }
  }
  ${POST_CONTENT_FRAGMENT}
  ${POST_STATS_FRAGMENT}
`;

// Simulate like mutation
const LIKE_POST_MUTATION = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likeCount
    }
  }
`;

// Component using useFragment - only re-renders when stats change
function PostStatsWithFragment({ postRef }: { readonly postRef: { __ref: string } }) {
  const { data, complete } = useFragment({
    fragment: POST_STATS_FRAGMENT,
    from: postRef,
  });

  const [renderCount, setRenderCount] = useState(0);
  
  // Track renders
  useState(() => {
    setRenderCount((c) => c + 1);
  });

  console.log('🔄 PostStatsWithFragment rendered', renderCount);

  if (!complete) return <div>Loading stats...</div>;

  return (
    <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
      <h4>Stats (useFragment) - Render #{renderCount}</h4>
      <p>❤️ {data.likeCount} likes</p>
      <p>💬 {data.commentCount} comments</p>
    </div>
  );
}

// Component using props - re-renders whenever parent re-renders
function PostStatsWithProps({ 
  likeCount, 
  commentCount 
}: { 
  readonly likeCount: number;
  readonly commentCount: number;
}) {
  const [renderCount, setRenderCount] = useState(0);
  
  // Track renders
  useState(() => {
    setRenderCount((c) => c + 1);
  });

  console.log('🔄 PostStatsWithProps rendered', renderCount);

  return (
    <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
      <h4>Stats (Props) - Render #{renderCount}</h4>
      <p>❤️ {likeCount} likes</p>
      <p>💬 {commentCount} comments</p>
    </div>
  );
}

// Component using useFragment for content
function PostContentWithFragment({ postRef }: { readonly postRef: { __ref: string } }) {
  const { data, complete } = useFragment({
    fragment: POST_CONTENT_FRAGMENT,
    from: postRef,
  });

  const [renderCount, setRenderCount] = useState(0);
  
  useState(() => {
    setRenderCount((c) => c + 1);
  });

  console.log('🔄 PostContentWithFragment rendered', renderCount);

  if (!complete) return <div>Loading content...</div>;

  return (
    <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px', marginBottom: '12px' }}>
      <h4>Content (useFragment) - Render #{renderCount}</h4>
      <p><strong>{data.author.displayName}</strong></p>
      <p>{data.content}</p>
      <p style={{ color: '#666', fontSize: '12px' }}>
        {new Date(data.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

export function FragmentComparisonPage() {
  const [forceRenderCount, setForceRenderCount] = useState(0);
  const [postId] = useState('sample-post-id'); // In real app, get from route

  const { data, loading, error } = useQuery(GET_POST_QUERY, {
    variables: { id: postId },
  });

  // Simulate parent component re-render
  const handleForceRender = () => {
    console.log('🔃 Parent component forced re-render');
    setForceRenderCount((c) => c + 1);
  };

  // Simulate updating like count
  const handleLike = () => {
    console.log('👍 Simulating like (would be mutation in real app)');
    // In real app, this would call useMutation
    // For demo, we're just showing the concept
  };

  if (loading) return <div>Loading post...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data?.post) return <div>Post not found</div>;

  const post = data.post;
  const postCacheId = { __ref: `Post:${post.id}` };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>useFragment vs Props Comparison</h1>
        <p style={{ color: '#666' }}>
          Demonstrates how useFragment prevents unnecessary re-renders
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={handleForceRender}
            style={{
              padding: '12px 24px',
              backgroundColor: '#9c27b0',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Force Parent Re-render ({forceRenderCount})
          </button>
          <button
            onClick={handleLike}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f50057',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Like Post ❤️
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Using useFragment */}
        <div style={{ padding: '24px', border: '2px solid #4caf50', borderRadius: '8px' }}>
          <h2 style={{ color: '#4caf50' }}>✅ Using useFragment</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Components only re-render when their specific data changes
          </p>
          
          <PostContentWithFragment postRef={postCacheId} />
          <PostStatsWithFragment postRef={postCacheId} />
          
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f1f8e9', borderRadius: '4px' }}>
            <strong>Expected Behavior:</strong>
            <ul style={{ fontSize: '14px', marginTop: '8px' }}>
              <li>PostContent won't re-render when stats change</li>
              <li>PostStats won't re-render when content changes</li>
              <li>Both isolated from parent re-renders</li>
            </ul>
          </div>
        </div>

        {/* Right: Using traditional props */}
        <div style={{ padding: '24px', border: '2px solid #ff9800', borderRadius: '8px' }}>
          <h2 style={{ color: '#ff9800' }}>⚠️ Using Props (Traditional)</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Components re-render whenever parent re-renders
          </p>
          
          <div style={{ padding: '12px', backgroundColor: '#fbe9e7', borderRadius: '4px', marginBottom: '12px' }}>
            <h4>Content (Props)</h4>
            <p><strong>{post.author.displayName}</strong></p>
            <p>{post.content}</p>
          </div>
          
          <PostStatsWithProps 
            likeCount={post.likeCount} 
            commentCount={post.commentCount} 
          />
          
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
            <strong>Expected Behavior:</strong>
            <ul style={{ fontSize: '14px', marginTop: '8px' }}>
              <li>All child components re-render on parent change</li>
              <li>No isolation between components</li>
              <li>Can cause performance issues in large UIs</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2>📊 How to Test</h2>
        <ol>
          <li>
            <strong>Open Browser Console</strong> to see render logs
          </li>
          <li>
            <strong>Click "Force Parent Re-render"</strong>
            <ul>
              <li>useFragment components should NOT re-render</li>
              <li>Props-based components WILL re-render</li>
            </ul>
          </li>
          <li>
            <strong>Click "Like Post"</strong> (would update stats in real app)
            <ul>
              <li>Only PostStats components should re-render</li>
              <li>PostContent should stay unchanged</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h2>🎯 When to Use useFragment</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#bbdefb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Scenario</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>useFragment?</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>Complex UI with frequent updates</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>✅ Yes</td>
              <td style={{ padding: '12px' }}>Isolate updates, prevent cascading re-renders</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>Reusable component library</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>✅ Yes</td>
              <td style={{ padding: '12px' }}>Self-contained data requirements</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>Real-time data (likes, views)</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>✅ Yes</td>
              <td style={{ padding: '12px' }}>Update only affected components</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>Simple static page</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>❌ No</td>
              <td style={{ padding: '12px' }}>Added complexity not worth it</td>
            </tr>
            <tr>
              <td style={{ padding: '12px' }}>Data doesn't update frequently</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>❌ No</td>
              <td style={{ padding: '12px' }}>Props are simpler</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
