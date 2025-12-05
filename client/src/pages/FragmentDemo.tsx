import React, { useState, useRef } from 'react';
import { useQuery, useFragment, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

/**
 * UseFragment List Rendering Demo
 * 
 * This demonstrates useFragment's REAL power: efficient list rendering!
 * 
 * THE KEY INSIGHT:
 * - Pass only IDs as props (not full objects)
 * - Each component reads from cache directly
 * - Updating ONE item only re-renders THAT item
 * - Parent and siblings DON'T re-render
 * 
 * WITHOUT useFragment: Update one post → parent re-renders → ALL children re-render
 * WITH useFragment: Update one post → only THAT post re-renders, others untouched
 */

// Fragment for post card
const POST_CARD_FRAGMENT = gql`
  fragment PostCardData on Post {
    id
    content
    likeCount
    commentCount
    author {
      id
      displayName
      avatarUrl
    }
  }
`;

// Query to load multiple posts
const GET_POSTS_QUERY = gql`
  query GetPosts($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          ...PostCardData
        }
      }
    }
  }
  ${POST_CARD_FRAGMENT}
`;

// Query WITH @nonreactive - parent won't re-render on user data changes
const GET_POSTS_NONREACTIVE_QUERY = gql`
  query GetPostsNonreactive($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id # Parent watches ID changes (add/remove items)
          ...PostCardData @nonreactive # But NOT user data changes
        }
      }
    }
  }
  ${POST_CARD_FRAGMENT}
`;

// Component WITH useFragment - receives only ID, reads from cache
function PostCardWithFragment({ 
  postId, 
  onClick 
}: { 
  readonly postId: string;
  readonly onClick: () => void;
}) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const { data, complete } = useFragment({
    fragment: POST_CARD_FRAGMENT,
    from: { __typename: 'Post', id: postId },
    fragmentName: 'PostCardData',
  });

  if (!complete || !data) return null;

  const renderColor = renderCountRef.current > 1 ? '#ff9800' : '#2196f3';

  return (
    <div style={{ 
      padding: '12px', 
      backgroundColor: '#e3f2fd', 
      borderRadius: '8px', 
      marginBottom: '8px',
      border: `2px solid ${renderColor}`,
      transition: 'border-color 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <img 
            src={data.author.avatarUrl} 
            alt={data.author.displayName}
            style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '13px' }}>{data.author.displayName}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              {data.content.substring(0, 40)}...
            </p>
          </div>
        </div>
        <div style={{ fontSize: '12px', textAlign: 'right', marginLeft: '12px' }}>
          <button
            onClick={onClick}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            👍 {data.likeCount}
          </button>
          <div style={{ color: renderColor, fontWeight: 'bold', marginTop: '4px' }}>
            Renders: {renderCountRef.current}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component WITHOUT useFragment - receives full post object as prop
function PostCardWithoutFragment({ 
  post,
  onClick
}: { 
  readonly post: {
    id: string;
    content: string;
    likeCount: number;
    commentCount: number;
    author: { displayName: string; avatarUrl: string };
  };
  readonly onClick: () => void;
}) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const renderColor = renderCountRef.current > 1 ? '#ff9800' : '#d32f2f';

  return (
    <div style={{ 
      padding: '12px', 
      backgroundColor: '#ffebee', 
      borderRadius: '8px', 
      marginBottom: '8px',
      border: `2px solid ${renderColor}`,
      transition: 'border-color 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <img 
            src={post.author.avatarUrl} 
            alt={post.author.displayName}
            style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '13px' }}>{post.author.displayName}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              {post.content.substring(0, 40)}...
            </p>
          </div>
        </div>
        <div style={{ fontSize: '12px', textAlign: 'right', marginLeft: '12px' }}>
          <button
            onClick={onClick}
            style={{
              padding: '6px 12px',
              backgroundColor: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            👍 {post.likeCount}
          </button>
          <div style={{ color: renderColor, fontWeight: 'bold', marginTop: '4px' }}>
            Renders: {renderCountRef.current}
          </div>
        </div>
      </div>
    </div>
  );
}

// Parent component WITH useFragment - tracks its own renders
function FeedWithFragment() {
  const parentRenderRef = useRef(0);
  parentRenderRef.current += 1;

  // Use @nonreactive query - parent only re-renders when IDs change (add/remove)
  // NOT when user data changes!
  const { data, loading, client } = useQuery(GET_POSTS_NONREACTIVE_QUERY, {
    variables: { first: 10 },
  });

  const incrementLikes = (postId: string) => {
    // Update cache directly - thanks to @nonreactive, parent won't re-render!
    // Only the PostCardWithFragment for this specific post will re-render
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Post', id: postId }),
      fields: {
        likeCount(existingValue = 0) {
          return existingValue + 1;
        },
      },
    });
    // NO setSelectedPostId here! That would cause parent to re-render
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  const postIds = data.feed.edges.map(edge => edge.node.id);

  return (
    <div>
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px', 
        marginBottom: '16px',
        border: '2px solid #2196f3'
      }}>
        <h3 style={{ color: '#2196f3', margin: '0 0 8px 0' }}> WITH useFragment</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>
          Each post receives only an ID. Components read directly from cache.
        </p>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2196f3' }}>
          Parent (Feed) renders: {parentRenderRef.current}
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '12px' }}>
        {postIds.map(postId => (
          <PostCardWithFragment 
            key={postId} 
            postId={postId} 
            onClick={() => incrementLikes(postId)}
          />
        ))}
      </div>
    </div>
  );
}

// Parent component WITHOUT useFragment - passes full objects
function FeedWithoutFragment() {
  const parentRenderRef = useRef(0);
  parentRenderRef.current += 1;

  // Uses cache-and-network so cache updates trigger re-renders
  const { data, loading, client } = useQuery(GET_POSTS_QUERY, {
    variables: { first: 10 },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network', // Keep watching cache
  });

  const handleIncrementLikes = (postId: string) => {
    // Update cache - because parent uses cache-and-network AND watches all fields,
    // this triggers the parent to re-render, which causes ALL children to re-render.
    // This is the inefficient pattern we're comparing against!
    const postRef = client.cache.identify({ __typename: 'Post', id: postId });
    client.cache.modify({
      id: postRef,
      fields: {
        likeCount(existingValue = 0) {
          return existingValue + 1;
        },
      },
    });
  };

  if (loading && !data) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!data?.feed?.edges) return null;

  const posts = data.feed.edges.map(edge => edge.node);

  return (
    <div>
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#ffebee', 
        borderRadius: '8px', 
        marginBottom: '16px',
        border: '2px solid #d32f2f'
      }}>
        <h3 style={{ color: '#d32f2f', margin: '0 0 8px 0' }}> WITHOUT useFragment</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>
          Each post receives full object as prop. Parent watches cache with useQuery.
        </p>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#d32f2f' }}>
          Parent (Feed) renders: {parentRenderRef.current}
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '12px' }}>
        {posts.map(post => (
          <PostCardWithoutFragment 
            key={post.id} 
            post={post} 
            onClick={() => handleIncrementLikes(post.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function FragmentDemoPage() {
  const [testStarted, setTestStarted] = useState(false);

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
    console.log(' UseFragment List Rendering Demo');
    console.log('');
    console.log('📍 THE DIFFERENCE:');
    console.log('  Regular: Parent passes full post objects → cache update re-renders parent → parent re-renders ALL children');
    console.log('  UseFragment: Parent passes only IDs → each child reads from cache → only changed child re-renders');
    
    console.log('');
    setTestStarted(true);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1> UseFragment: Client Enhancement</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Expected outcome with useFragment: updating one item doesn't re-render siblings or parent!
        </p>
      </header>

      {/* Test Button */}
      {!testStarted && (
        <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <button
            onClick={startTest}
            style={{
              padding: '16px 32px',
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            ▶ Start Demo
          </button>
        </div>
      )}

      {/* Side-by-side comparison */}
      {testStarted && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <ApolloProvider client={clientWithoutFragment}>
              <FeedWithoutFragment />
            </ApolloProvider>
          </div>

          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <ApolloProvider client={clientWithFragment}>
              <FeedWithFragment />
            </ApolloProvider>
          </div>
        </div>
      )}
    </div>
  );
}
