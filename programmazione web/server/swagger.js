const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Universe Hero album API',
    description: 'These are the bees for interacting with the server for managing a virtual cards album, purchasing packages, managing packages, managing users and exchanging cards'
  },
  host: 'localhost:3000'
};

const outputFile = './swagger-output.json';
const routes = ['./index.js'];

swaggerAutogen(outputFile, routes, doc);