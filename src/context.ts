import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import DataLoader from 'dataloader';
import { prisma } from './db.js';

export interface Context {
  prisma: PrismaClient;
  user: User | null;
  loaders: {
    authorLoader: DataLoader<number, User | null>;
  };
}

type JwtPayload = {
  userId: number;
};

export const context = async ({ req }: { req: any }): Promise<Context> => {
  const auth = req.headers.authorization || '';
  let user: User | null = null;

  if (auth.startsWith('Bearer ')) {
    try {
      const token = auth.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    } catch {
      user = null;
    }
  }

  const authorLoader = new DataLoader<number, User | null>(async (authorIds) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...authorIds] } },
    });

    return authorIds.map((id) => users.find((u) => u.id === id) || null);
  });

  return {
    prisma,
    user,
    loaders: {
      authorLoader,
    },
  };
};