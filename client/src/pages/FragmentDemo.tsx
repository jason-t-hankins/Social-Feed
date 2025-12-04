import React, { useState, useRef } from 'react';
import { useQuery, useFragment, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

/**
 * UseFragment Re-render Optimization Demo
 * 
 * This demonstrates UseFragment's power for reducing unnecessary re-renders:
 * When you update ONE field (like likeCount), only components subscribed to that
 * field re-render - other components stay unchanged!
 * 
 * WITHOUT useFragment: Update likes → entire post card re-renders
 * WITH useFragment: Update likes → only PostStats re-renders, PostContent unchanged
 */

// Fragment definitions
const POST_CONTENT_FRAGMENT = gql`
  fragment PostContent on Post {
    id
    content
    author {
      id
      displayName
      avatarUrl
    }
  }
`;

const POST_STATS_FRAGMENT = gql`
  fragment PostStats on Post {
    id
    likeCount
    commentCount
  }
`;

const GET_POST_QUERY = gql`
  query GetPost {
    feed(first: 1) {
      edges {
        node {
          id
          content
          createdAt
          likeCount
          commentCount
          author {
            id
            displayName
            avatarUrl
          }
        }
      }
    }
  }
`;

// Component WITH useFragment - only re-renders when its fragment data changes
function PostContentWithFragment({ postRef }: { readonly postRef: { __typename: string; id: string } }) {
  const renderCountRef = useRef(0);

  const { data, complete } = useFragment({
    fragment: POST_CONTENT_FRAGMENT,
    from: postRef,
    fragmentName: 'PostContent',
  });

  // Track renders - increment happens on each render
  React.useEffect(() => {
    renderCountRef.current += 1;
  });

  if (!complete || !data) return null;

  console.log(`[WITH Fragment] PostContent rendered ${renderCountRef.current} times`);

  return (
    <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <img 
          src={data.author.avatarUrl} 
          alt={data.author.displayName}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
        />
        <strong>{data.author.displayName}</strong>
      </div>
      <p style={{ margin: '8px 0' }}>{data.content}</p>
      <div style={{ fontSize: '12px', color: '#2196f3', fontWeight: 'bold' }}>
        PostContent renders: {renderCountRef.current}
      </div>
    </div>
  );
}

function PostStatsWithFragment({ postRef }: { readonly postRef: { __typename: string; id: string } }) {
  const renderCountRef = useRef(0);

  const { data, complete } = useFragment({
    fragment: POST_STATS_FRAGMENT,
    from: postRef,
    fragmentName: 'PostStats',
  });

  // Track renders - increment happens on each render
  React.useEffect(() => {
    renderCountRef.current += 1;
  });

  if (!complete || !data) return null;

  console.log(`[WITH Fragment] PostStats rendered ${renderCountRef.current} times`);

  return (
    <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
      <div style={{ fontSize: '14px' }}>
        ❤️ {data.likeCount} | 💬 {data.commentCount}
      </div>
      <div style={{ fontSize: '12px', color: '#2196f3', fontWeight: 'bold', marginTop: '8px' }}>
        PostStats renders: {renderCountRef.current}
      </div>
    </div>
  );
}

// Component WITHOUT useFragment - re-renders whenever ANY data changes
function PostContentWithoutFragment({ 
  post 
}: { 
  readonly post: {
    content: string;
    author: { displayName: string; avatarUrl: string };
  }
}) {
  const renderCountRef = useRef(0);

  // Track renders - increment happens on each render
  React.useEffect(() => {
    renderCountRef.current += 1;
  });

  console.log(`[WITHOUT Fragment] PostContent rendered ${renderCountRef.current} times`);

  return (
    <div style={{ padding: '16px', backgroundColor: '#ffebee', borderRadius: '8px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <img 
          src={post.author.avatarUrl} 
          alt={post.author.displayName}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
        />
        <strong>{post.author.displayName}</strong>
      </div>
      <p style={{ margin: '8px 0' }}>{post.content}</p>
      <div style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold' }}>
        PostContent renders: {renderCountRef.current}
      </div>
    </div>
  );
}

function PostStatsWithoutFragment({ 
  post 
}: { 
  readonly post: {
    likeCount: number;
    commentCount: number;
  }
}) {
  const renderCountRef = useRef(0);

  // Track renders - increment happens on each render
  React.useEffect(() => {
    renderCountRef.current += 1;
  });

  console.log(`[WITHOUT Fragment] PostStats rendered ${renderCountRef.current} times`);

  return (
    <div style={{ padding: '16px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
      <div style={{ fontSize: '14px' }}>
        ❤️ {post.likeCount} | 💬 {post.commentCount}
      </div>
      <div style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold', marginTop: '8px' }}>
        PostStats renders: {renderCountRef.current}
      </div>
    </div>
  );
}

// Test component WITH useFragment
function WithFragmentTest() {
  const { data, loading, client } = useQuery(GET_POST_QUERY, {
    // Don't re-run query when cache updates
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const incrementLikes = () => {
    if (!data?.feed?.edges?.[0]) return;
    
    const post = data.feed.edges[0].node;
    
    // Update ONLY the likeCount field - this is the key!
    // Only components watching this specific field will re-render
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Post', id: post.id }),
      fields: {
        likeCount(existingValue = 0) {
          return existingValue + 1;
        },
      },
      // This prevents the whole Post from being marked as changed
      broadcast: true,
    });
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!data?.feed?.edges?.[0]) return null;

  const post = data.feed.edges[0].node;
  const postRef = { __typename: 'Post' as const, id: post.id };

  return (
    <div>
      <h3 style={{ color: '#2196f3' }}>WITH useFragment</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Fine-grained subscriptions - only affected components re-render
      </p>
      
      <PostContentWithFragment postRef={postRef} />
      <PostStatsWithFragment postRef={postRef} />
      
      <button
        onClick={incrementLikes}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          backgroundColor: '#2196f3',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        👍 Increment Likes (Watch Re-renders!)
      </button>
      
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '14px' }}>
        <strong>Expected behavior:</strong> When you click "Increment Likes", only PostStats should re-render.
        PostContent should NOT re-render because its data didn't change!
      </div>
    </div>
  );
}

// Test component WITHOUT useFragment
function WithoutFragmentTest() {
  const { data, loading, client } = useQuery(GET_POST_QUERY, {
    // Re-run query when cache updates - this causes full component re-render
    fetchPolicy: 'cache-and-network',
  });

  const incrementLikes = () => {
    if (!data?.feed?.edges?.[0]) return;
    
    const post = data.feed.edges[0].node;
    
    // Update likeCount - with cache-and-network, this re-runs the query
    // causing the entire parent component to re-render with new props
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Post', id: post.id }),
      fields: {
        likeCount(existingValue = 0) {
          return existingValue + 1;
        },
      },
    });
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!data?.feed?.edges?.[0]) return null;

  const post = data.feed.edges[0].node;

  return (
    <div>
      <h3 style={{ color: '#d32f2f' }}> WITHOUT useFragment</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Props-based - entire component tree re-renders on any change
      </p>
      
      <PostContentWithoutFragment post={post} />
      <PostStatsWithoutFragment post={post} />
      
      <button
        onClick={incrementLikes}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          backgroundColor: '#d32f2f',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        👍 Increment Likes (Watch Re-renders!)
      </button>
      
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '14px' }}>
        <strong>Expected behavior:</strong> When you click "Increment Likes", BOTH PostContent AND PostStats
        will re-render, even though PostContent's data didn't change. Wasteful!
      </div>
    </div>
  );
}

export function FragmentDemoPage() {
  const [testRun, setTestRun] = useState(0);

  // Create TWO separate clients so they don't share cache
  const clientWithoutFragment = useRef(
    new ApolloClient({
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
      cache: new InMemoryCache(),
    })
  ).current;

  const clientWithFragment = useRef(
    new ApolloClient({
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
      cache: new InMemoryCache(),
    })
  ).current;

  const startTest = () => {
    console.clear();
    console.log(' UseFragment Re-render Test');
    console.log(' Watch the console for render counts');
    console.log(' Click "Increment Likes" and see which components re-render');
    console.log('');
    setTestRun(prev => prev + 1);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>UseFragment Re-render Optimization</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Demonstrating fine-grained re-render control with useFragment
        </p>
      </header>

      {/* Test Button */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <button
          onClick={startTest}
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
          ▶ Start Test (Open Console!)
        </button>
      </div>

      {/* Side-by-side comparison */}
      {testRun > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #d32f2f' }}>
            <ApolloProvider client={clientWithoutFragment}>
              <WithoutFragmentTest />
            </ApolloProvider>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #2196f3' }}>
            <ApolloProvider client={clientWithFragment}>
              <WithFragmentTest />
            </ApolloProvider>
          </div>
        </div>
      )}
    </div>
  );
}
