const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");

// Schéma GraphQL
const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    usersByName(name: String!): [User]
    post(id: ID!): Post
    posts: [Post]
  }
   
  type Mutation {
    addPost(title: String!, content: String!, authorId: ID!): Post
    addComment(postId: ID!, userId: ID!, content: String!): Comment
    likePost(postId: ID!, userId: ID!): Post
  }

  type User {
    id: ID!
    name: String
    email: String
    posts: [Post]
    followers: [User]
    following: [User]
  }

  type Post {
    id: ID!
    title: String
    content: String
    author: User
    likes: [User]
    comments: [Comment]
  }

  type Comment {
    id: ID!
    content: String
    author: User
    post: Post
  }
`);

// Données simulées
const users = [
  {
    id: "0",
    name: "Alice",
    email: "alice@example.com",
    followers: ["zoe", "Sam", "Bob"],
    following: ["Sam", "Bob"],
  },
  {
    id: "1",
    name: "Bob",
    email: "bob@example.com",
    followers: ["Alice", "Zoe"],
    following: ["zoe", "Sam"],
  },
  {
    id: "2",
    name: "Sam",
    email: "sam@example.com",
    followers: ["Alice", "Zoe"],
    following: ["Alice", "Zoe", "Bob"],
  },
  {
    id: "3",
    name: "Zoe",
    email: "zoe@example.com",
    followers: ["Alice", "Bob"],
    following: ["Bob", "Sam"],
  },
];

const posts = [
  {
    id: "0",
    title: "AliceLife",
    content: "Contenu sur la Vie de Alice",
    author: "0",
    likes: ["Zoe", "Sam", "Bob"],
    comments: ["Super !!"],
  },

  {
    id: "1",
    title: "BobJobs",
    content: "Contenu sur le travail Alice",
    author: "0",
    likes: ["Zoe", "Alice"],
    comments: ["Super !!"],
  },

  {
    id: "2",
    title: "Sammmm Family",
    content: "Contenu sur la Vie de Famille de Sam",
    author: "0",
    likes: ["Zoe", "Alice"],
    comments: ["Super !!"],
  },
];

const comments = [];

// Résolveurs, les fonctions pour gerer les abonnemets, likes et commentaires

const root = {
  user: ({ id }) => {
    const user = users.find((user) => user.id === id);
    if (user) {
      user.posts = posts.filter((post) => post.author === user.id);
    }
    return user;
  },

  usersByName: ({ name }) =>
    users.filter((user) =>
      user.name.toLowerCase().includes(name.toLowerCase())
    ),
  post: ({ id }) => {
    const post = posts.find((post) => post.id === id);
    if (post) {
      post.author = users.find((user) => user.id === post.author);
      post.likes = post.likes.map((likeId) =>
        users.find((user) => user.id === likeId)
      );
      post.comments = comments.filter((comment) => comment.post === post.id);
    }
    return post;
  },

  posts: () =>
    posts.map((post) => ({
      ...post,
      author: users.find((user) => user.id === post.author),
      likes: post.likes.map((likeId) =>
        users.find((user) => user.id === likeId)
      ),
      comments: comments.filter((comment) => comment.post === post.id),
    })),

  addPost: ({ title, content, authorId }) => {
    const newPost = {
      id: String(posts.length),
      title,
      content,
      author: authorId,
      likes: [],
      comments: [],
    };
    posts.push(newPost);
    return newPost;
  },

  addComment: ({ postId, userId, content }) => {
    const newComment = {
      id: String(comments.length),
      content,
      author: userId,
      post: postId,
    };
    comments.push(newComment);
    return {
      ...newComment,
      author: users.find((user) => user.id === userId),
      post: posts.find((post) => post.id === postId),
    };
  },

  likePost: ({ postId, userId }) => {
    const post = posts.find((post) => post.id === postId);
    if (post && !post.likes.includes(userId)) {
      post.likes.push(userId);
    }
    return post;
  },
};

// Création du serveur Express
const app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

// Lancement du serveur
app.listen(4000, () =>
  console.log("Serveur GraphQL lancé sur http://localhost:4000/graphql")
);
