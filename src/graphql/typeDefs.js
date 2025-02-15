const { gql } = require("graphql-tag"); // Correct for Apollo Server v4+

const typeDefs = gql`
  # Root query type definition
  type Query {
    getUser(id: ID!): User
    getUsers: [User]
  }

  type AuthResponse {
    user: User
    token: String
  }

  # Mutation type definition
  type Mutation {
    register(username: String!, password: String!, email: String!): User
    login(email: String!, password: String!): AuthResponse
  }

  # User type
  type User {
    id: ID!
    username: String!
    password: String!
    email: String!
  }

  # Optional: If you plan to use subscriptions, define a Subscription type
  type Subscription {
    userRegistered: User
    userLogged: AuthResponse
  }
`;

module.exports = typeDefs;
