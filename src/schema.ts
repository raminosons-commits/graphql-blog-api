export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    posts: [Post!]!
    comments: [Comment!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    published: Boolean!
    author: User!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    body: String!
    createdAt: String!
    author: User!
    post: Post!
  }

  input CreatePostInput {
    title: String!
    content: String!
    published: Boolean
  }

  input UpdatePostInput {
    title: String
    content: String
    published: Boolean
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts(page: Int, limit: Int): [Post!]!
    post(id: ID!): Post
    me: User
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
  }
`;