import { gql } from '@apollo/client';

/**
 * Query with cache-first policy (default)
 * Demonstrates: Aggressive caching for public/static data
 */
export const GET_FEED_CACHE_FIRST = gql`
  query GetFeedCacheFirst($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          createdAt
          likeCount
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

/**
 * Query with network-only policy
 * Demonstrates: Always fresh data for sensitive/dynamic content
 */
export const GET_FEED_NETWORK_ONLY = gql`
  query GetFeedNetworkOnly($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          createdAt
          likeCount
          author {
            id
            displayName
          }
        }
      }
    }
  }
`;

/**
 * Query with cache-and-network policy
 * Demonstrates: Show cached data instantly, refresh in background
 */
export const GET_FEED_CACHE_AND_NETWORK = gql`
  query GetFeedCacheAndNetwork($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          content
          createdAt
          likeCount
          author {
            id
            displayName
          }
        }
      }
    }
  }
`;

/**
 * Query requesting minimal user fields
 * Demonstrates: Cache merge with varying field selections
 */
export const GET_USER_MINIMAL = gql`
  query GetUserMinimal($id: ID!) {
    user(id: $id) {
      id
      displayName
    }
  }
`;

/**
 * Query requesting full user profile including sensitive data
 * Demonstrates: Field-level cache policies masking SSN
 */
export const GET_USER_FULL = gql`
  query GetUserFull($id: ID!) {
    user(id: $id) {
      id
      username
      displayName
      avatarUrl
      createdAt
      ssn
      postCount
    }
  }
`;

/**
 * Fragment for post card (used with useFragment)
 * Demonstrates: Reading cached data without executing query
 */
export const POST_CARD_FRAGMENT = gql`
  fragment PostCardData on Post {
    id
    content
    createdAt
    likeCount
    author {
      id
      displayName
      avatarUrl
    }
  }
`;

/**
 * Mutation with optimistic response
 * Demonstrates: Instant UI update before server confirmation
 */
export const LIKE_POST_MUTATION = gql`
  mutation LikePost($postId: ID!, $userId: ID!) {
    likePost(postId: $postId, userId: $userId) {
      id
      postId
      userId
    }
  }
`;

/**
 * Query for single post (to be updated by optimistic mutation)
 */
export const GET_POST_WITH_LIKES = gql`
  query GetPostWithLikes($id: ID!) {
    post(id: $id) {
      id
      content
      likeCount
      author {
        id
        displayName
      }
    }
  }
`;
