const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');

const CONFIG = require('./config.js');
const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');
const isAuth = require('./middleware/isAuth');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('res - app.js: ', res);
    console.log('req - app.js: ', req);
    // BUG
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(isAuth);

app.use(
    '/graphql', 
    graphqlHTTP({
        schema: graphQlSchema,
        rootValue: graphQlResolvers,
        graphiql: true
    })
);

mongoose.connect(`mongodb+srv://${CONFIG.USERNAME}:${CONFIG.PASSWORD}@cluster0.yej4m.mongodb.net/${CONFIG.DB}?retryWrites=true&w=majority`, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    app.listen(8000);
})
.catch(err => {
    console.log(err);
});