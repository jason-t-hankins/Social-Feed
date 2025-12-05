import { useState } from 'react';
import { useQuery, useFragment, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

/**
 * Approach 3: UseFragment + HttpLink
 * Cache subscriptions only
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
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '2px solid #2196f3',
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
      backgroundColor: '#e3f2fd', 
      borderRadius: '8px',
      border: '2px solid #2196f3',
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
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        marginBottom: '16px',
        border: '2px solid #2196f3'
      }}>
        <strong>✅ Loaded {data.feed.edges.length} posts in {duration}ms</strong>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
          Components subscribe to cache changes via useFragment
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
  link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
  cache: new InMemoryCache(),
});

export function FragmentHttpLinkPage() {
  const [postCount, setPostCount] = useState(20);
  const [started, setStarted] = useState(false);

  return (
    <ApolloProvider client={client}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#2196f3' }}>3. UseFragment + HttpLink</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Cache subscription optimization
          </p>
        </header>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h2>What's This Testing?</h2>
          <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <li><strong>UseFragment:</strong> Components subscribe to cache changes</li>
            <li><strong>HttpLink:</strong> Each GraphQL operation = separate HTTP request</li>
            <li><strong>Cache optimization:</strong> Only components using changed data re-render</li>
            <li><strong>Fine-grained updates:</strong> Update likes without re-rendering content</li>
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
                backgroundColor: '#2196f3',
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
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#555',
          border: '1px solid #2196f3'
        }}>
          <strong>When to use this approach:</strong> UseFragment excels at rendering lists where you pass only IDs as props and let leaf components read directly from cache. This prevents re-render waterfalls (updating one list item doesn't re-render siblings or parents) and eliminates prop-drilling. Most beneficial for lists, nested structures, and when you want targeted cache reads rather than passing full data objects down the component tree.
        </p>
      </div>
    </ApolloProvider>
  );
}
