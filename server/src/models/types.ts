import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: Date;
}

export interface Post {
  _id: ObjectId;
  authorId: ObjectId;
  content: string;
  createdAt: Date;
}

export interface Comment {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  content: string;
  createdAt: Date;
}

export interface Like {
  _id: ObjectId;
  postId: ObjectId;
  userId: ObjectId;
  createdAt: Date;
}

// GraphQL types for resolvers
export interface UserNode {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export interface PostNode {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface CommentNode {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface LikeNode {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}
