import { gql } from '@apollo/client';

/**
 * Fragment Definitions
 * 
 * Fragments allow components to declare their data requirements.
 * This is called "fragment colocation" - keeping data requirements
 * close to the components that use them.
 * 
 * Benefits:
 * 1. Components are self-contained and portable
 * 2. Easy to see what data a component needs
 * 3. Apollo Client can optimize cache reads with useFragment
 * 4. Reduces over-fetching by only requesting needed fields
 */

/**
 * UserInfo fragment - basic user display information.
 * Used by UserAvatar and UserBadge components.
 */
export const USER_INFO_FRAGMENT = gql`
  fragment UserInfo on User {
    id
    username
    displayName
    avatarUrl
  }
`;

/**
 * UserStats fragment - user statistics for profile views.
 */
export const USER_STATS_FRAGMENT = gql`
  fragment UserStats on User {
    id
    postCount
  }
`;

/**
 * PostContent fragment - main post content fields.
 */
export const POST_CONTENT_FRAGMENT = gql`
  fragment PostContent on Post {
    id
    content
    createdAt
  }
`;

/**
 * PostStats fragment - engagement statistics.
 * These counts are efficiently loaded via DataLoader on the server.
 */
export const POST_STATS_FRAGMENT = gql`
  fragment PostStats on Post {
    id
    commentCount
    likeCount
  }
`;

/**
 * CommentContent fragment - comment display data.
 */
export const COMMENT_CONTENT_FRAGMENT = gql`
  fragment CommentContent on Comment {
    id
    content
    createdAt
  }
`;

/**
 * LikeInfo fragment - like metadata.
 */
export const LIKE_INFO_FRAGMENT = gql`
  fragment LikeInfo on Like {
    id
    createdAt
  }
`;

/**
 * Composed fragment for full post card display.
 * Combines multiple fragments for efficient data loading.
 */
export const POST_CARD_FRAGMENT = gql`
  fragment PostCard on Post {
    ...PostContent
    ...PostStats
    author {
      ...UserInfo
    }
  }
  ${POST_CONTENT_FRAGMENT}
  ${POST_STATS_FRAGMENT}
  ${USER_INFO_FRAGMENT}
`;

/**
 * Full post detail fragment including comments.
 */
export const POST_DETAIL_FRAGMENT = gql`
  fragment PostDetail on Post {
    ...PostCard
    comments {
      ...CommentContent
      author {
        ...UserInfo
      }
    }
    likes {
      ...LikeInfo
      user {
        ...UserInfo
      }
    }
  }
  ${POST_CARD_FRAGMENT}
  ${COMMENT_CONTENT_FRAGMENT}
  ${LIKE_INFO_FRAGMENT}
  ${USER_INFO_FRAGMENT}
`;
