import { gql } from '@apollo/client';
import { POST_CONTENT_FRAGMENT, POST_STATS_FRAGMENT, USER_INFO_FRAGMENT, COMMENT_CONTENT_FRAGMENT, LIKE_INFO_FRAGMENT } from './fragments';

/**
 * Create Post Mutation
 */
export const CREATE_POST = gql`
  mutation CreatePost($authorId: ID!, $content: String!) {
    createPost(authorId: $authorId, content: $content) {
      ...PostContent
      ...PostStats
      author {
        ...UserInfo
      }
    }
  }
  ${POST_CONTENT_FRAGMENT}
  ${POST_STATS_FRAGMENT}
  ${USER_INFO_FRAGMENT}
`;

/**
 * Add Comment Mutation
 */
export const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $authorId: ID!, $content: String!) {
    addComment(postId: $postId, authorId: $authorId, content: $content) {
      ...CommentContent
      author {
        ...UserInfo
      }
    }
  }
  ${COMMENT_CONTENT_FRAGMENT}
  ${USER_INFO_FRAGMENT}
`;

/**
 * Like Post Mutation
 */
export const LIKE_POST = gql`
  mutation LikePost($postId: ID!, $userId: ID!) {
    likePost(postId: $postId, userId: $userId) {
      ...LikeInfo
      user {
        ...UserInfo
      }
    }
  }
  ${LIKE_INFO_FRAGMENT}
  ${USER_INFO_FRAGMENT}
`;

/**
 * Unlike Post Mutation
 */
export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!, $userId: ID!) {
    unlikePost(postId: $postId, userId: $userId)
  }
`;
