import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import type { Context } from './context.js';

export const resolvers = {
  Query: {
    users: async (_parent: any, _args: any, { prisma }: Context) => {
      return prisma.user.findMany();
    },
    user: async (_parent: any, { id }: any, { prisma }: Context) => {
      return prisma.user.findUnique({ where: { id: Number(id) } });
    },
    posts: async (_parent: any, { page = 1, limit = 10 }: any, { prisma }: Context) => {
      return prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
      });
    },
    post: async (_parent: any, { id }: any, { prisma }: Context) => {
      return prisma.post.findUnique({ where: { id: Number(id) } });
    },
    me: async (_parent: any, _args: any, { user }: Context) => {
      if (!user) {
        throw new GraphQLError('Authentification requise', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return user;
    },
  },

  Mutation: {
    login: async (_parent: any, { email, password }: any, { prisma }: Context) => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new GraphQLError('Utilisateur introuvable', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new GraphQLError('Mot de passe incorrect', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      return { token, user };
    },

    createPost: async (_parent: any, { input }: any, { user, prisma }: Context) => {
      if (!user) {
        throw new GraphQLError('Authentification requise', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          published: input.published ?? false,
          authorId: user.id,
        },
      });
    },

    updatePost: async (_parent: any, { id, input }: any, { user, prisma }: Context) => {
      if (!user) {
        throw new GraphQLError('Authentification requise', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existingPost = await prisma.post.findUnique({
        where: { id: Number(id) },
      });

      if (!existingPost) {
        throw new GraphQLError('Post introuvable', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return prisma.post.update({
        where: { id: Number(id) },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.published !== undefined ? { published: input.published } : {}),
        },
      });
    },

    deletePost: async (_parent: any, { id }: any, { user, prisma }: Context) => {
      if (!user) {
        throw new GraphQLError('Authentification requise', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await prisma.post.delete({ where: { id: Number(id) } });
      return true;
    },
  },

  User: {
    posts: (parent: any, _args: any, { prisma }: Context) => {
      return prisma.post.findMany({ where: { authorId: parent.id } });
    },
    comments: (parent: any, _args: any, { prisma }: Context) => {
      return prisma.comment.findMany({ where: { authorId: parent.id } });
    },
  },

  Post: {
    author: async (parent: any, _args: any, { loaders }: Context) => {
      return loaders.authorLoader.load(parent.authorId);
    },
    comments: (parent: any, _args: any, { prisma }: Context) => {
      return prisma.comment.findMany({ where: { postId: parent.id } });
    },
  },

  Comment: {
    author: (parent: any, _args: any, { prisma }: Context) => {
      return prisma.user.findUnique({ where: { id: parent.authorId } });
    },
    post: (parent: any, _args: any, { prisma }: Context) => {
      return prisma.post.findUnique({ where: { id: parent.postId } });
    },
  },
};