import { useState } from 'react';
import { useQuery, useFragment, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

/**
 * Approach 4: UseFragment + BatchHttpLink
 * Both optimizations combined
 */

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

interface FeedData {
  feed: {
    edges: Array<{ node: Post }>;
  };
}

function PostCardWithFragment({ post }: { readonly post: Post }) {
  const { data, complete } = useFragment({
    fragment: POST_FRAGMENT,
    from: {
      __typename: post.__typename,
      id: post.id,
    },
    fragmentName: 'PostBasic',
  });

  if (!complete || !data) {
    return (
      <div style={{ 
        padding: '16px', 
        marginBottom: '12px', 
        backgroundColor: '#e8f5e9', 
        borderRadius: '8px',
        border: '2px solid #4caf50',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <strong>Loading from cache...</strong>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px', 
      marginBottom: '12px', 
      backgroundColor: '#e8f5e9', 
      borderRadius: '8px',
      border: '2px solid #4caf50',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <img 
          src={data.author.avatarUrl} 
          alt={data.author.displayName}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
        />
        <strong>{data.author.displayName}</strong>
      </div>
      <p style={{ margin: '8px 0', fontSize: '14px' }}>{data.content}</p>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        ❤️ {data.likeCount} | 💬 {data.commentCount}
      </div>
    </div>
  );
}

function FeedContent({ postCount }: { readonly postCount: number }) {
  const startTime = Date.now();
  const { data, loading, error } = useQuery<FeedData>(GET_POSTS_QUERY, {
    variables: { first: postCount },
  });

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;
  }

  if (!data?.feed?.edges) {
    return <div style={{ padding: '20px', color: '#999' }}>No posts found</div>;
  }

  const duration = Date.now() - startTime;

  return (
    <>
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e8f5e9', 
        borderRadius: '8px',
        marginBottom: '16px',
        border: '2px solid #4caf50'
      }}>
        <strong>✅ Loaded {data.feed.edges.length} posts in {duration}ms</strong>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
          🎉 Both optimizations active: batching + cache subscriptions!
        </div>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {data.feed.edges.map(edge => (
          <PostCardWithFragment key={edge.node.id} post={edge.node} />
        ))}
      </div>
    </>
  );
}

const client = new ApolloClient({
  link: new BatchHttpLink({
    uri: 'http://localhost:4000/graphql',
    batchMax: 50,
    batchInterval: 10,
  }),
  cache: new InMemoryCache(),
});

export function FragmentBatchLinkPage() {
  const [postCount, setPostCount] = useState(20);
  const [started, setStarted] = useState(false);

  return (
    <ApolloProvider client={client}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#4caf50' }}>4. UseFragment + BatchHttpLink</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Both optimizations combined (Production-ready!)
          </p>
        </header>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h2>What's This Testing?</h2>
          <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <li><strong>UseFragment:</strong> Components subscribe to cache changes</li>
            <li><strong>BatchHttpLink:</strong> Combines multiple operations into single HTTP request</li>
            <li><strong>Network + Cache optimization:</strong> Best of both worlds</li>
            <li><strong>Production pattern:</strong> This is the recommended approach!</li>
          </ul>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginTop: 0 }}>Test Configuration</h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              Number of posts to load:
            </label>
            <input
              type="number"
              value={postCount}
              onChange={(e) => setPostCount(Number(e.target.value))}
              min={1}
              max={120}
              disabled={started}
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100px',
                fontSize: '14px',
              }}
            />
          </div>

          {!started && (
            <button
              onClick={() => setStarted(true)}
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
              ▶ Start Test
            </button>
          )}
        </div>

        {started && (
          <div>
            <FeedContent postCount={postCount} />
          </div>
        )}

        <p style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#555',
          border: '2px solid #4caf50'
        }}>
          <strong>🎯 Production-ready pattern:</strong> This is the recommended approach for most real-world apps! Use it when multiple widgets/components query simultaneously (batching saves HTTP roundtrips), you're rendering lists with many items (useFragment enables passing IDs instead of full objects), and you want to eliminate re-render waterfalls (updating one item doesn't re-render siblings). Combines network optimization with architectural benefits for maintainable, scalable apps.
        </p>
      </div>
    </ApolloProvider>
  );
}
