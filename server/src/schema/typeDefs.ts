export const typeDefs = `#graphql
  """
  User type representing a user in the social feed system.
  Demonstrates fragment colocation - components can define their own data requirements.
  """
  type User {
    id: ID!
    username: String!
    displayName: String!
    avatarUrl: String!
    createdAt: String!
    posts: [Post!]!
    """
    Total number of posts by this user
    """
    postCount: Int!
  }

  """
  Post type - the main content unit in the social feed.
  Each post has an author, content, comments, and likes.
  """
  type Post {
    id: ID!
    author: User!
    content: String!
    createdAt: String!
    comments: [Comment!]!
    likes: [Like!]!
    """
    Count of comments - useful for batched count queries
    """
    commentCount: Int!
    """
    Count of likes - demonstrates DataLoader efficiency for aggregations
    """
    likeCount: Int!
  }

  """
  Comment type - represents user comments on posts.
  Shows nested data relationships suitable for fragment testing.
  """
  type Comment {
    id: ID!
    post: Post!
    author: User!
    content: String!
    createdAt: String!
  }

  """
  Like type - represents user likes on posts.
  Useful for testing batched operations and counts.
  """
  type Like {
    id: ID!
    post: Post!
    user: User!
    createdAt: String!
  }

  """
  Connection types for pagination
  """
  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  """
  Root Query type
  """
  type Query {
    """
    Get the main feed of posts with pagination.
    Demonstrates DataLoader batching for efficient data retrieval.
    """
    feed(first: Int, after: String): PostConnection!
    
    """
    Get a single post by ID
    """
    post(id: ID!): Post
    
    """
    Get a single user by ID
    """
    user(id: ID!): User
    
    """
    Get all users - useful for testing batching scenarios
    """
    users: [User!]!
    
    """
    Get all posts - alternative to feed without pagination
    """
    posts: [Post!]!
    
    """
    Get public feed of posts (no authentication required).
    Suitable for CDN/ISP caching with Cache-Control headers.
    """
    publicFeed(first: Int = 10, after: String): PostConnection!
    
    """
    Get a single public post by ID (no authentication required).
    Suitable for public caching.
    """
    publicPost(id: ID!): Post
  }

  """
  Root Mutation type
  """
  type Mutation {
    """
    Create a new post
    """
    createPost(authorId: ID!, content: String!): Post!
    
    """
    Add a comment to a post
    """
    addComment(postId: ID!, authorId: ID!, content: String!): Comment!
    
    """
    Like a post
    """
    likePost(postId: ID!, userId: ID!): Like!
    
    """
    Unlike a post
    """
    unlikePost(postId: ID!, userId: ID!): Boolean!
  }
`;
