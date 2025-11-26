import DataLoader from 'dataloader';
import { ObjectId } from 'mongodb';
import { User, Post, Comment, Like } from '../models/types';
import { CollectionLike } from '../models/collection';

/**
 * DataLoader factory functions for efficient batching.
 * 
 * DataLoader is a utility that batches and caches individual data loads
 * within a single request, solving the N+1 query problem.
 * 
 * When multiple resolvers request the same data (e.g., user by ID),
 * DataLoader collects all IDs and fetches them in a single database query.
 * 
 * IMPORTANT: DataLoader instances should be created per-request to prevent
 * data leakage between different users/requests.
 */

export interface DataLoaderContext {
  userLoader: DataLoader<string, User | null>;
  postLoader: DataLoader<string, Post | null>;
  commentLoader: DataLoader<string, Comment | null>;
  likeLoader: DataLoader<string, Like | null>;
  postsByAuthorLoader: DataLoader<string, Post[]>;
  commentsByPostLoader: DataLoader<string, Comment[]>;
  likesByPostLoader: DataLoader<string, Like[]>;
  commentCountByPostLoader: DataLoader<string, number>;
  likeCountByPostLoader: DataLoader<string, number>;
  postCountByAuthorLoader: DataLoader<string, number>;
}

/**
 * Creates all DataLoaders for a single request.
 * Each loader is tied to specific MongoDB collections.
 */
export function createDataLoaders(
  usersCollection: CollectionLike<User>,
  postsCollection: CollectionLike<Post>,
  commentsCollection: CollectionLike<Comment>,
  likesCollection: CollectionLike<Like>
): DataLoaderContext {
  return {
    /**
     * Batch load users by their IDs.
     * When resolving Post.author for 10 posts, this makes 1 query instead of 10.
     */
    userLoader: new DataLoader<string, User | null>(async (ids) => {
      console.log(`[DataLoader] Batched user load for ${ids.length} IDs:`, ids);
      const objectIds = ids.map((id) => new ObjectId(id));
      const users = await usersCollection.find({ _id: { $in: objectIds } }).toArray();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));
      return ids.map((id) => userMap.get(id) || null);
    }),

    /**
     * Batch load posts by their IDs.
     */
    postLoader: new DataLoader<string, Post | null>(async (ids) => {
      console.log(`[DataLoader] Batched post load for ${ids.length} IDs:`, ids);
      const objectIds = ids.map((id) => new ObjectId(id));
      const posts = await postsCollection.find({ _id: { $in: objectIds } }).toArray();
      const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
      return ids.map((id) => postMap.get(id) || null);
    }),

    /**
     * Batch load comments by their IDs.
     */
    commentLoader: new DataLoader<string, Comment | null>(async (ids) => {
      console.log(`[DataLoader] Batched comment load for ${ids.length} IDs:`, ids);
      const objectIds = ids.map((id) => new ObjectId(id));
      const comments = await commentsCollection.find({ _id: { $in: objectIds } }).toArray();
      const commentMap = new Map(comments.map((c) => [c._id.toString(), c]));
      return ids.map((id) => commentMap.get(id) || null);
    }),

    /**
     * Batch load likes by their IDs.
     */
    likeLoader: new DataLoader<string, Like | null>(async (ids) => {
      console.log(`[DataLoader] Batched like load for ${ids.length} IDs:`, ids);
      const objectIds = ids.map((id) => new ObjectId(id));
      const likes = await likesCollection.find({ _id: { $in: objectIds } }).toArray();
      const likeMap = new Map(likes.map((l) => [l._id.toString(), l]));
      return ids.map((id) => likeMap.get(id) || null);
    }),

    /**
     * Batch load posts by author ID.
     * Returns array of posts for each author.
     */
    postsByAuthorLoader: new DataLoader<string, Post[]>(async (authorIds) => {
      console.log(`[DataLoader] Batched posts by author load for ${authorIds.length} authors`);
      const objectIds = authorIds.map((id) => new ObjectId(id));
      const posts = await postsCollection.find({ authorId: { $in: objectIds } }).toArray();
      const postsByAuthor = new Map<string, Post[]>();
      posts.forEach((post) => {
        const authorId = post.authorId.toString();
        if (!postsByAuthor.has(authorId)) {
          postsByAuthor.set(authorId, []);
        }
        postsByAuthor.get(authorId)!.push(post);
      });
      return authorIds.map((id) => postsByAuthor.get(id) || []);
    }),

    /**
     * Batch load comments by post ID.
     * Essential for efficient comment loading on feed display.
     */
    commentsByPostLoader: new DataLoader<string, Comment[]>(async (postIds) => {
      console.log(`[DataLoader] Batched comments by post load for ${postIds.length} posts`);
      const objectIds = postIds.map((id) => new ObjectId(id));
      const comments = await commentsCollection.find({ postId: { $in: objectIds } }).toArray();
      const commentsByPost = new Map<string, Comment[]>();
      comments.forEach((comment) => {
        const postId = comment.postId.toString();
        if (!commentsByPost.has(postId)) {
          commentsByPost.set(postId, []);
        }
        commentsByPost.get(postId)!.push(comment);
      });
      return postIds.map((id) => commentsByPost.get(id) || []);
    }),

    /**
     * Batch load likes by post ID.
     * Enables efficient like loading across multiple posts.
     */
    likesByPostLoader: new DataLoader<string, Like[]>(async (postIds) => {
      console.log(`[DataLoader] Batched likes by post load for ${postIds.length} posts`);
      const objectIds = postIds.map((id) => new ObjectId(id));
      const likes = await likesCollection.find({ postId: { $in: objectIds } }).toArray();
      const likesByPost = new Map<string, Like[]>();
      likes.forEach((like) => {
        const postId = like.postId.toString();
        if (!likesByPost.has(postId)) {
          likesByPost.set(postId, []);
        }
        likesByPost.get(postId)!.push(like);
      });
      return postIds.map((id) => likesByPost.get(id) || []);
    }),

    /**
     * Batch load comment counts by post ID.
     * Uses MongoDB aggregation for efficient counting.
     */
    commentCountByPostLoader: new DataLoader<string, number>(async (postIds) => {
      console.log(`[DataLoader] Batched comment count for ${postIds.length} posts`);
      const objectIds = postIds.map((id) => new ObjectId(id));
      const counts = await commentsCollection
        .aggregate([
          { $match: { postId: { $in: objectIds } } },
          { $group: { _id: '$postId', count: { $sum: 1 } } },
        ])
        .toArray();
      const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
      return postIds.map((id) => countMap.get(id) || 0);
    }),

    /**
     * Batch load like counts by post ID.
     */
    likeCountByPostLoader: new DataLoader<string, number>(async (postIds) => {
      console.log(`[DataLoader] Batched like count for ${postIds.length} posts`);
      const objectIds = postIds.map((id) => new ObjectId(id));
      const counts = await likesCollection
        .aggregate([
          { $match: { postId: { $in: objectIds } } },
          { $group: { _id: '$postId', count: { $sum: 1 } } },
        ])
        .toArray();
      const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
      return postIds.map((id) => countMap.get(id) || 0);
    }),

    /**
     * Batch load post counts by author ID.
     */
    postCountByAuthorLoader: new DataLoader<string, number>(async (authorIds) => {
      console.log(`[DataLoader] Batched post count for ${authorIds.length} authors`);
      const objectIds = authorIds.map((id) => new ObjectId(id));
      const counts = await postsCollection
        .aggregate([
          { $match: { authorId: { $in: objectIds } } },
          { $group: { _id: '$authorId', count: { $sum: 1 } } },
        ])
        .toArray();
      const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
      return authorIds.map((id) => countMap.get(id) || 0);
    }),
  };
}
