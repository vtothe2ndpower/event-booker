const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CONFIG = require('./config');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!
        }

        type User {
            _id: ID!
            email: String!
            password: String
            createdEvents: [Event!]
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event 
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
            .populate('creator')
            .then(events => {
                return events.map(event => {
                    return { 
                        ...event._doc, 
                        _id: event.id 
                    };
                });
            }).catch(err => {
                throw err;
            });
        },
        createEvent: args => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '610f0570385b2a49abda2108'
            });
            let createdEvent;
            return event
            .save()
            .then(result => {
                createdEvent = { ...result._doc, _id: result._doc._id.toString() };
                return User.findById('610f0570385b2a49abda2108')
            })
            .then(user => {
                if (!user) {
                    throw new Error('User not found.');
                }
                user.createdEvents.push(event);
                return user.save();
            })
            .then(result => {
                return createdEvent;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
        },
        createUser: args => {
            return User.findOne({ email: args.userInput.email })
            .then(user => {
                if (user) {
                    throw new Error('User already exists.')
                }
                return bcrypt.hash(args.userInput.password, 12);
            })
            .then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });
                return user.save();
            }) 
            .then(result => {
                return { ...result._doc, password: null, _id: result.id }
            })
            .catch(err => {
                throw err;
            });
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${CONFIG.USERNAME}:${CONFIG.PASSWORD}@cluster0.yej4m.mongodb.net/${CONFIG.DB}?retryWrites=true&w=majority`)
.then(() => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});