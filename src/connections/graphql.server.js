const { PubSub } = require("graphql-subscriptions");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws"); // ✅ Corrected import
const typeDefs = require("../graphql/typeDefs");
const resolvers = require("../graphql/resolvers");
const logger = require("../logger/logger");

const pubsub = new PubSub(); // ✅ Ensure PubSub instance

async function createGraphQlServer(httpServer, app) {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // ✅ WebSocket Server for Subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // ✅ Use graphql-ws for subscriptions
  useServer(
    {
      schema,
      context: async () => ({ pubsub }), // ✅ Ensure pubsub is in WebSocket context
    },
    wsServer
  );

  // ✅ Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: async ({ req, connection }) => {
      if (connection) {
        // WebSocket connection
        return { pubsub };
      }
      // HTTP request
      return { pubsub };
    },
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ pubsub }), // ✅ Ensures HTTP requests get pubsub
    })
  );

  logger.info(`🚀 GraphQL Server ready at path /graphql`);
}

module.exports = { createGraphQlServer };
