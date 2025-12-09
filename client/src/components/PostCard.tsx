import { gql } from '@apollo/client';
import { UserAvatar, USER_AVATAR_FRAGMENT } from './UserAvatar';
import { PostStats, POST_STATS_DISPLAY_FRAGMENT } from './PostStats';

/**
 * PostCard Component
 * 
 * Main post display component demonstrating fragment composition:
 * - Composes multiple child fragments
 * - Each child component declares and receives its own data
 * - Parent query includes all fragments automatically
 * 
 * Fragment Colocation Benefits:
 * 1. PostCard doesn't need to know internal data needs of UserAvatar
 * 2. Adding/removing fields in UserAvatar doesn't require PostCard changes
 * 3. GraphQL query is automatically kept in sync with component needs
 */

export const POST_CARD_DISPLAY_FRAGMENT = gql`
  fragment PostCardDisplay on Post {
    id
    content
    createdAt
    ...PostStatsDisplay
    author {
      ...UserAvatarFragment
    }
  }
  ${POST_STATS_DISPLAY_FRAGMENT}
  ${USER_AVATAR_FRAGMENT}
`;

interface PostCardProps {
  post: {
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
  isInteractive?: boolean;
  onLikeClick?: (postId: string) => void;
}

export function PostCard({ post, isInteractive = false, onLikeClick }: PostCardProps) {
  const handleLikeClick = () => {
    if (onLikeClick) {
      onLikeClick(post.id);
    }
  };
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      className="post-card"
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <UserAvatar user={post.author} size="medium" />
        <time style={{ color: '#888', fontSize: '14px' }}>{formattedDate}</time>
      </header>
      
      <p style={{ fontSize: '16px', lineHeight: 1.5, margin: '12px 0' }}>
        {post.content}
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <PostStats post={post} />
        {isInteractive ? (
          <button
            onClick={handleLikeClick}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Like
          </button>
        ) : (
          <button
            onClick={() => alert('Please login to like posts')}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              backgroundColor: '#e0e0e0',
              color: '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
            }}
            title="Login required"
          >
            Like
          </button>
        )}
      </div>
    </article>
  );
}
