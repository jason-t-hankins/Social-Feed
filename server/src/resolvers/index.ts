import { ObjectId } from 'mongodb';
import { User, Post, Comment, Like } from '../models/types';
import { CollectionLike } from '../models/collection';
import { DataLoaderContext } from '../dataloaders';

export interface ResolverContext {
  loaders: DataLoaderContext;
  collections: {
    users: CollectionLike<User>;
    posts: CollectionLike<Post>;
    comments: CollectionLike<Comment>;
    likes: CollectionLike<Like>;
  };
  isPublic?: boolean; // Flag to indicate public vs authenticated endpoint
}

/**
 * GraphQL Resolvers demonstrating DataLoader integration.
 * 
 * These resolvers show how DataLoader solves the N+1 problem:
 * - Without DataLoader: Loading 10 posts with authors = 1 + 10 queries
 * - With DataLoader: Loading 10 posts with authors = 1 + 1 queries (batched)
 */
export const resolvers = {
  Query: {
    /**
     * Main feed query with cursor-based pagination.
     * Returns posts in reverse chronological order.
     */
    feed: async (
      _: unknown,
      { first = 10, after }: { first?: number; after?: string },
      { collections }: ResolverContext
    ) => {
      const limit = Math.min(first, 50); // Cap at 50
      let query = {};

      if (after) {
        try {
          // Decode cursor (base64 encoded ObjectId)
          const decodedCursor = Buffer.from(after, 'base64').toString('utf-8');
          // Validate that the decoded cursor is a valid ObjectId
          if (!ObjectId.isValid(decodedCursor)) {
            throw new Error('Invalid cursor format');
          }
          query = { _id: { $lt: new ObjectId(decodedCursor) } };
        } catch {
          throw new Error('Invalid cursor');
        }
      }

      const posts = await collections.posts
        .find(query)
        .sort({ _id: -1 })
        .limit(limit + 1) // Fetch one extra to check hasNextPage
        .toArray();

      const hasNextPage = posts.length > limit;
      if (hasNextPage) {
        posts.pop(); // Remove the extra post
      }

      const totalCount = await collections.posts.countDocuments();

      const edges = posts.map((post: Post) => ({
        node: {
          id: post._id.toString(),
          authorId: post.authorId.toString(),
          content: post.content,
          createdAt: post.createdAt.toISOString(),
        },
        cursor: Buffer.from(post._id.toString()).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      };
    },

    post: async (_: unknown, { id }: { id: string }, { loaders }: ResolverContext) => {
      const post = await loaders.postLoader.load(id);
      if (!post) return null;
      return {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      };
    },

    user: async (_: unknown, { id }: { id: string }, { loaders }: ResolverContext) => {
      const user = await loaders.userLoader.load(id);
      if (!user) return null;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      };
    },

    users: async (_: unknown, __: unknown, { collections }: ResolverContext) => {
      const users = await collections.users.find().toArray();
      return users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      }));
    },

    posts: async (_: unknown, __: unknown, { collections }: ResolverContext) => {
      const posts = await collections.posts.find().sort({ _id: -1 }).toArray();
      return posts.map((post: Post) => ({
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      }));
    },

    /**
     * PUBLIC QUERIES - No authentication required
     * These queries are designed to be cached by CDNs and ISPs
     */

    /**
     * Public feed - same as feed but explicitly public for caching
     */
    publicFeed: async (
      _: unknown,
      { first = 10, after }: { first?: number; after?: string },
      { collections }: ResolverContext
    ) => {
      console.log('[Public Query] publicFeed called');
      const limit = Math.min(first, 50);
      let query = {};

      if (after) {
        try {
          const decodedCursor = Buffer.from(after, 'base64').toString('utf-8');
          if (!ObjectId.isValid(decodedCursor)) {
            throw new Error('Invalid cursor format');
          }
          query = { _id: { $lt: new ObjectId(decodedCursor) } };
        } catch {
          throw new Error('Invalid cursor');
        }
      }

      const posts = await collections.posts
        .find(query)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .toArray();

      const hasNextPage = posts.length > limit;
      if (hasNextPage) {
        posts.pop();
      }

      const totalCount = await collections.posts.countDocuments();

      const edges = posts.map((post: Post) => ({
        node: {
          id: post._id.toString(),
          authorId: post.authorId.toString(),
          content: post.content,
          createdAt: post.createdAt.toISOString(),
        },
        cursor: Buffer.from(post._id.toString()).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      };
    },

    /**
     * Public post - get a single post without authentication
     */
    publicPost: async (_: unknown, { id }: { id: string }, { loaders }: ResolverContext) => {
      console.log('[Public Query] publicPost called for ID:', id);
      const post = await loaders.postLoader.load(id);
      if (!post) return null;
      return {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      };
    },
  },

  Mutation: {
    createPost: async (
      _: unknown,
      { authorId, content }: { authorId: string; content: string },
      { collections }: ResolverContext
    ) => {
      const post: Post = {
        _id: new ObjectId(),
        authorId: new ObjectId(authorId),
        content,
        createdAt: new Date(),
      };
      await collections.posts.insertOne(post);
      return {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      };
    },

    addComment: async (
      _: unknown,
      { postId, authorId, content }: { postId: string; authorId: string; content: string },
      { collections }: ResolverContext
    ) => {
      const comment: Comment = {
        _id: new ObjectId(),
        postId: new ObjectId(postId),
        authorId: new ObjectId(authorId),
        content,
        createdAt: new Date(),
      };
      await collections.comments.insertOne(comment);
      return {
        id: comment._id.toString(),
        postId: comment.postId.toString(),
        authorId: comment.authorId.toString(),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      };
    },

    likePost: async (
      _: unknown,
      { postId, userId }: { postId: string; userId: string },
      { collections }: ResolverContext
    ) => {
      // Check if already liked
      const existing = await collections.likes.findOne({
        postId: new ObjectId(postId),
        userId: new ObjectId(userId),
      });
      if (existing) {
        return {
          id: existing._id.toString(),
          postId: existing.postId.toString(),
          userId: existing.userId.toString(),
          createdAt: existing.createdAt.toISOString(),
        };
      }

      const like: Like = {
        _id: new ObjectId(),
        postId: new ObjectId(postId),
        userId: new ObjectId(userId),
        createdAt: new Date(),
      };
      await collections.likes.insertOne(like);
      return {
        id: like._id.toString(),
        postId: like.postId.toString(),
        userId: like.userId.toString(),
        createdAt: like.createdAt.toISOString(),
      };
    },

    unlikePost: async (
      _: unknown,
      { postId, userId }: { postId: string; userId: string },
      { collections }: ResolverContext
    ) => {
      const result = await collections.likes.deleteOne({
        postId: new ObjectId(postId),
        userId: new ObjectId(userId),
      });
      return result.deletedCount > 0;
    },
  },

  /**
   * Post resolver - demonstrates DataLoader usage for related data.
   * These field resolvers use DataLoader to batch load related entities.
   */
  Post: {
    /**
     * Resolve the author of a post using DataLoader.
     * When rendering multiple posts, all author requests are batched.
     */
    author: async (
      parent: { authorId: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const user = await loaders.userLoader.load(parent.authorId);
      if (!user) return null;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      };
    },

    /**
     * Resolve comments for a post using batched loading.
     */
    comments: async (
      parent: { id: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const comments = await loaders.commentsByPostLoader.load(parent.id);
      return comments.map((comment) => ({
        id: comment._id.toString(),
        postId: comment.postId.toString(),
        authorId: comment.authorId.toString(),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      }));
    },

    /**
     * Resolve likes for a post using batched loading.
     */
    likes: async (
      parent: { id: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const likes = await loaders.likesByPostLoader.load(parent.id);
      return likes.map((like) => ({
        id: like._id.toString(),
        postId: like.postId.toString(),
        userId: like.userId.toString(),
        createdAt: like.createdAt.toISOString(),
      }));
    },

    /**
     * Efficiently get comment count using batched aggregation.
     */
    commentCount: async (
      parent: { id: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      return loaders.commentCountByPostLoader.load(parent.id);
    },

    /**
     * Efficiently get like count using batched aggregation.
     */
    likeCount: async (
      parent: { id: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      return loaders.likeCountByPostLoader.load(parent.id);
    },
  },

  /**
   * User resolver - demonstrates nested batching.
   */
  User: {
    posts: async (
      parent: { id: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const posts = await loaders.postsByAuthorLoader.load(parent.id);
      return posts.map((post) => ({
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      }));
    },

    postCount: async (
      parent: { id: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      return loaders.postCountByAuthorLoader.load(parent.id);
    },
  },

  /**
   * Comment resolver - nested DataLoader usage.
   */
  Comment: {
    post: async (
      parent: { postId: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const post = await loaders.postLoader.load(parent.postId);
      if (!post) return null;
      return {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      };
    },

    author: async (
      parent: { authorId: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const user = await loaders.userLoader.load(parent.authorId);
      if (!user) return null;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      };
    },
  },

  /**
   * Like resolver - demonstrates cross-entity batching.
   */
  Like: {
    post: async (
      parent: { postId: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const post = await loaders.postLoader.load(parent.postId);
      if (!post) return null;
      return {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      };
    },

    user: async (
      parent: { userId: string },
      _: unknown,
      { loaders }: ResolverContext
    ) => {
      const user = await loaders.userLoader.load(parent.userId);
      if (!user) return null;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      };
    },
  },
};
