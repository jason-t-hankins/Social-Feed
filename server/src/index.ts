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
import { generateToken } from './auth';

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

  // Apply middleware globally (required for Apollo Server 4)
  app.use(cors<cors.CorsRequest>());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // For query params

  // Root route
  app.get('/', (_req, res) => {
    res.json({
      message: 'GraphQL Social Feed API',
      endpoints: {
        graphql: '/graphql',
        graphqlPublic: '/graphql-public',
        login: 'POST /auth/login',
      },
    });
  });

  // Login endpoint - returns JWT token
  app.post('/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log('[Login] Attempt:', { username, passwordProvided: !!password });

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // Find user in database
      const user = await collections.users.findOne({ username });
      
      if (!user) {
        console.log('[Login] User not found:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // In production, use bcrypt to compare hashed passwords
      // For demo purposes, we'll accept any password (NOT SECURE!)
      if (password !== 'demo') {
        console.log('[Login] Invalid password for user:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log('[Login] Success:', username);

      // Generate JWT token
      const token = generateToken(user._id.toString(), user.username);

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create Apollo Server with HTTP batching enabled
  const server = new ApolloServer<ResolverContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Plugin to control cache headers per response
      {
        async requestDidStart() {
          return {
            async willSendResponse({ response, contextValue }) {
              const ctx = contextValue as ResolverContext;
              // Set cache headers based on endpoint
              if (ctx.isPublic) {
                response.http.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
              } else {
                response.http.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
              }
            },
          };
        },
      },
    ],
    // Enable operation batching (allows client to send multiple operations in one HTTP request)
    allowBatchedHttpRequests: true,
    // Enable automatic persisted queries (APQ)
    persistedQueries: {
      // APQ is enabled by default, but let's be explicit
      cache: undefined, // Use in-memory cache
    },
    // Allow GET requests for queries (required for APQ with GET)
    csrfPrevention: false, // Disable CSRF for GET requests
  });

  await server.start();

  // Authenticated GraphQL endpoint (existing)
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }): Promise<ResolverContext> => {
        // Create fresh DataLoader instances per request
        // This is crucial - DataLoader caches results, so using the same
        // instance across requests would cause stale data issues
        const loaders = createDataLoaders(
          collections.users,
          collections.posts,
          collections.comments,
          collections.likes
        );

        // Check for X-Public-Query header to support conditional auth demo
        // This allows the same endpoint to serve both authenticated and public queries
        const isPublicQuery = req.headers['x-public-query'] === 'true';

        return {
          loaders,
          collections,
          isPublic: isPublicQuery, // Mark as public if header present
        };
      },
    })
  );

  // Public GraphQL endpoint (no authentication required)
  app.use(
    '/graphql-public',
    (req, _res, next) => {
      console.log(`[Public GraphQL] ${req.method} ${req.url}`);
      
      // For GET requests, Apollo Server expects data in req.body
      // Transform query params to body format
      if (req.method === 'GET' && req.query) {
        req.body = {
          operationName: req.query.operationName,
          variables: req.query.variables ? JSON.parse(req.query.variables as string) : undefined,
          extensions: req.query.extensions ? JSON.parse(req.query.extensions as string) : undefined,
          query: req.query.query,
        };
        console.log('[Public GraphQL] Transformed body:', req.body);
      }
      next();
    },
    expressMiddleware(server, {
      context: async (): Promise<ResolverContext> => {
        try {
          const loaders = createDataLoaders(
            collections.users,
            collections.posts,
            collections.comments,
            collections.likes
          );

          return {
            loaders,
            collections,
            isPublic: true, // Mark as public endpoint for cache header plugin
          };
        } catch (error) {
          console.error('[Public GraphQL] Context error:', error);
          throw error;
        }
      },
    })
  );

  // Start HTTP server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`   - GraphQL (authenticated): http://localhost:${PORT}/graphql`);
  console.log(`   - GraphQL (public): http://localhost:${PORT}/graphql-public`);
  console.log(`   - Login: POST http://localhost:${PORT}/auth/login`);
  console.log(`📦 HTTP batching enabled`);
  console.log(`🔐 Demo credentials: username="alice" (or "bob"/"charlie"), password="demo"`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
