import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import { typeDefs } from './schema/typeDefs';
import { resolvers, ResolverContext } from './resolvers';
import { createDataLoaders } from './dataloaders';
import { User, Post, Comment, Like } from './models/types';
import { CollectionLike } from './models/collection';
import { createMockDatabase } from './mocks/mockMongo';

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'social_feed';
const PORT = parseInt(process.env.PORT || '4000', 10);

type DbLike = {
  collection: <T>(name: string) => CollectionLike<T>;
};

/**
 * Seed sample data for demonstration purposes.
 * In production, this would be handled by migrations or external scripts.
 */
async function seedDatabase(db: DbLike): Promise<void> {
  const usersCollection = db.collection<User>('users');
  const postsCollection = db.collection<Post>('posts');
  const commentsCollection = db.collection<Comment>('comments');
  const likesCollection = db.collection<Like>('likes');

  console.log('Seeding database with sample data...');


  // Create sample users
  const userList = [
    {
      username: 'alice',
      displayName: 'Alice Johnson',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
    {
      username: 'bob',
      displayName: 'Bob Smith',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
    {
      username: 'charlie',
      displayName: 'Charlie Brown',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    },
  ];
  const now = Date.now();
  const users = await usersCollection.insertMany(
    userList.map((u, i) => ({
      _id: new ObjectId(),
      ...u,
      createdAt: new Date(now - i * 10000),
    }))
  );
  const userIds = Object.values(users.insertedIds);

  // Generate a large number of posts for scale testing
  const NUM_POSTS = Number.parseInt(process.env.NUM_POSTS || '100', 10);
  const postContents = [
    'Radnomgenerated post content here!',
    'HIIII',
    'Sapamm',
    'Retweet!',
    'FallolutBOy',
    'TragicAF',
    'Gotta do the dishes',
    'GraphQL + React = ❤️ <-----',
    'Optimizing queries for fun and profit.',
    'Learning about DataLoader batchingBRUH.',
  ];
  const postsToInsert = Array.from({ length: NUM_POSTS }, (_, i) => ({
    _id: new ObjectId(),
    authorId: userIds[i % userIds.length],
    content: postContents[i % postContents.length] + ` [#${i + 1}]`,
    createdAt: new Date(now - i * 60000),
  }));
  const posts = await postsCollection.insertMany(postsToInsert);
  const postIds = Object.values(posts.insertedIds);

  // Create sample comments
  await commentsCollection.insertMany([
    {
      _id: new ObjectId(),
      postId: postIds[0],
      authorId: userIds[1],
      content: 'Great tip! Fragments really help with code organization.',
      createdAt: new Date(Date.now() - 3600000 * 4.5),
    },
    {
      _id: new ObjectId(),
      postId: postIds[0],
      authorId: userIds[2],
      content: 'I use fragments everywhere now!',
      createdAt: new Date(Date.now() - 3600000 * 4),
    },
    {
      _id: new ObjectId(),
      postId: postIds[1],
      authorId: userIds[0],
      content: 'DataLoader is essential for any GraphQL server.',
      createdAt: new Date(Date.now() - 3600000 * 3.5),
    },
    {
      _id: new ObjectId(),
      postId: postIds[2],
      authorId: userIds[0],
      content: 'useFragment changed how I think about React + GraphQL!',
      createdAt: new Date(Date.now() - 3600000 * 2.5),
    },
    {
      _id: new ObjectId(),
      postId: postIds[2],
      authorId: userIds[1],
      content: 'Combined with Suspense, it\'s even better.',
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
  ]);

  // Create sample likes
  await likesCollection.insertMany([
    { _id: new ObjectId(), postId: postIds[0], userId: userIds[1], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[0], userId: userIds[2], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[1], userId: userIds[0], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[1], userId: userIds[2], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[2], userId: userIds[0], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[2], userId: userIds[1], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[3], userId: userIds[1], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[4], userId: userIds[0], createdAt: new Date() },
    { _id: new ObjectId(), postId: postIds[4], userId: userIds[2], createdAt: new Date() },
  ]);

  console.log('Database seeded successfully!');
}

async function main(): Promise<void> {
  let db: DbLike;
  
  // Use mock in-memory database for development/testing without MongoDB
  if (USE_MOCK_DB) {
    console.log('Using mock in-memory database...');
    db = createMockDatabase();
    console.log('Mock database created');
  } else {
    // Connect to real MongoDB
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);
  }

  // Seed sample data
  await seedDatabase(db);

  // Get collections
  const collections = {
    users: db.collection<User>('users'),
    posts: db.collection<Post>('posts'),
    comments: db.collection<Comment>('comments'),
    likes: db.collection<Like>('likes'),
  };

  // Create Express app and HTTP server for Apollo Server 4
  const app = express();
  const httpServer = http.createServer(app);

  // Create Apollo Server with HTTP batching enabled
  const server = new ApolloServer<ResolverContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    // Enable operation batching (allows client to send multiple operations in one HTTP request)
    allowBatchedHttpRequests: true,
  });

  await server.start();

  // Apply Apollo middleware with CORS
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async (): Promise<ResolverContext> => {
        // Create fresh DataLoader instances per request
        // This is crucial - DataLoader caches results, so using the same
        // instance across requests would cause stale data issues
        const loaders = createDataLoaders(
          collections.users,
          collections.posts,
          collections.comments,
          collections.likes
        );

        return {
          loaders,
          collections,
        };
      },
    })
  );

  // Start HTTP server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(` Server ready at http://localhost:${PORT}/graphql`);
  console.log(` HTTP batching enabled`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
