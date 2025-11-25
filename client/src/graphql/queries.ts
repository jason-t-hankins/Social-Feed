import { gql } from '@apollo/client';
import {
  POST_CARD_FRAGMENT,
  USER_INFO_FRAGMENT,
  POST_STATS_FRAGMENT,
  POST_CONTENT_FRAGMENT,
  COMMENT_CONTENT_FRAGMENT,
} from './fragments';

/**
 * Main Feed Query
 * 
 * This query demonstrates fragment colocation:
 * - PostCard fragment contains all data needed for the post card component
 * - Each nested fragment maps to a specific component's needs
 * - Server-side DataLoader batches all related entity loads
 */
export const GET_FEED = gql`
  query GetFeed($first: Int, $after: String) {
    feed(first: $first, after: $after) {
      edges {
        cursor
        node {
          ...PostCard
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${POST_CARD_FRAGMENT}
`;

/**
 * Single Post Query with all details
 */
export const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      ...PostContent
      ...PostStats
      author {
        ...UserInfo
      }
      comments {
        ...CommentContent
        author {
          ...UserInfo
        }
      }
    }
  }
  ${POST_CONTENT_FRAGMENT}
  ${POST_STATS_FRAGMENT}
  ${USER_INFO_FRAGMENT}
  ${COMMENT_CONTENT_FRAGMENT}
`;

/**
 * User Profile Query
 */
export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserInfo
      postCount
      posts {
        ...PostContent
        ...PostStats
      }
    }
  }
  ${USER_INFO_FRAGMENT}
  ${POST_CONTENT_FRAGMENT}
  ${POST_STATS_FRAGMENT}
`;

/**
 * All Users Query - for testing batching
 */
export const GET_USERS = gql`
  query GetUsers {
    users {
      ...UserInfo
      postCount
    }
  }
  ${USER_INFO_FRAGMENT}
`;

/**
 * All Posts Query - alternative to paginated feed
 */
export const GET_POSTS = gql`
  query GetPosts {
    posts {
      ...PostCard
    }
  }
  ${POST_CARD_FRAGMENT}
`;
