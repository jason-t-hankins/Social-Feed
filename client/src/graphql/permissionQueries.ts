import { gql } from '@apollo/client';

/**
 * Query to demonstrate permission-aware caching
 * Admin users see analytics, regular users don't
 */
export const GET_FEED_WITH_ANALYTICS = gql`
  query GetFeedWithAnalytics($first: Int, $after: String) {
    feed(first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
          }
          commentCount
          likeCount
          analytics {
            viewCount
            avgTimeSpent
            engagementRate
            topCountries
          }
        }
        cursor
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
`;
