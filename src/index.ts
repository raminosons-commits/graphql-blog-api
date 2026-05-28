import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import type { Context } from './context.js';
import { context } from './context.js';

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

async function main() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context,
  });

  console.log(`🚀 Serveur prêt sur : ${url}`);
}

main().catch((err) => console.error(err));