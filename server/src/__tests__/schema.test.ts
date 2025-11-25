import { typeDefs } from '../schema/typeDefs';

describe('GraphQL Schema', () => {
  test('defines required types', () => {
    expect(typeDefs).toContain('type User');
    expect(typeDefs).toContain('type Post');
    expect(typeDefs).toContain('type Comment');
    expect(typeDefs).toContain('type Like');
  });

  test('User type has fragment-friendly fields', () => {
    // These fields are commonly used in fragments
    expect(typeDefs).toContain('id: ID!');
    expect(typeDefs).toContain('username: String!');
    expect(typeDefs).toContain('displayName: String!');
    expect(typeDefs).toContain('avatarUrl: String!');
  });

  test('Post type has count fields for batching', () => {
    // Count fields are loaded via DataLoader
    expect(typeDefs).toContain('commentCount: Int!');
    expect(typeDefs).toContain('likeCount: Int!');
  });

  test('defines Query type with feed', () => {
    expect(typeDefs).toContain('type Query');
    expect(typeDefs).toContain('feed(first: Int, after: String): PostConnection!');
  });

  test('defines Mutation type', () => {
    expect(typeDefs).toContain('type Mutation');
    expect(typeDefs).toContain('createPost');
    expect(typeDefs).toContain('addComment');
    expect(typeDefs).toContain('likePost');
    expect(typeDefs).toContain('unlikePost');
  });

  test('has pagination support', () => {
    expect(typeDefs).toContain('type PostConnection');
    expect(typeDefs).toContain('type PostEdge');
    expect(typeDefs).toContain('type PageInfo');
    expect(typeDefs).toContain('hasNextPage: Boolean!');
  });
});
