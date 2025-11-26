import { useQuery, gql } from '@apollo/client';
import { PostCard, POST_CARD_DISPLAY_FRAGMENT } from './PostCard';

/**
 * Feed Component
 * 
 * Main feed display using composed fragments.
 * Demonstrates how parent queries incorporate child fragments.
 * 
 * Performance Benefits:
 * 1. Single network request fetches all data
 * 2. Server-side DataLoader batches related entity loads
 * 3. Apollo Client normalizes response into cache
 * 4. Child components can use useFragment for targeted re-renders
 */

const GET_FEED_QUERY = gql`
  query GetFeed($first: Int, $after: String) {
    feed(first: $first, after: $after) {
      edges {
        cursor
        node {
          ...PostCardDisplay
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${POST_CARD_DISPLAY_FRAGMENT}
`;

interface FeedData {
  feed: {
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        content: string;
        createdAt: string;
        likeCount: number;
        commentCount: number;
        author: {
          id: string;
          displayName: string;
          avatarUrl: string;
        };
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

export function Feed() {
  const { data, loading, error, fetchMore } = useQuery<FeedData>(GET_FEED_QUERY, {
    variables: { first: 10 },
  });

  if (loading && !data) {
    return (
      <div className="feed-loading" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-error" style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
        <p>Error loading feed: {error.message}</p>
      </div>
    );
  }

  const handleLoadMore = () => {
    if (data?.feed.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.feed.pageInfo.endCursor,
        },
      });
    }
  };

  return (
    <div className="feed" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>Social Feed</h2>
        <p style={{ color: '#666', margin: '8px 0 0' }}>
          {data?.feed.totalCount ?? 0} posts total
        </p>
      </header>

      <div className="posts">
        {data?.feed.edges.map(({ node }) => (
          <PostCard key={node.id} post={node} />
        ))}
      </div>

      {data?.feed.pageInfo.hasNextPage && (
        <button
          onClick={handleLoadMore}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Load More
        </button>
      )}
    </div>
  );
}
