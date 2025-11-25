import { gql } from '@apollo/client';

/**
 * PostStats Component with Fragment
 * 
 * Displays engagement metrics (likes, comments) for a post.
 * Uses a colocated fragment to declare its data needs.
 */

export const POST_STATS_DISPLAY_FRAGMENT = gql`
  fragment PostStatsDisplay on Post {
    id
    likeCount
    commentCount
  }
`;

interface PostStatsProps {
  post: {
    id: string;
    likeCount: number;
    commentCount: number;
  };
}

export function PostStats({ post }: PostStatsProps) {
  return (
    <div className="post-stats" style={{ 
      display: 'flex', 
      gap: '16px', 
      color: '#666',
      fontSize: '14px',
      marginTop: '12px'
    }}>
      <span>❤️ {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
      <span>💬 {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
    </div>
  );
}
