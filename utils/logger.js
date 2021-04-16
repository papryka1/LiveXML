const { createLogger, format, transports, config } = require('winston');
require('winston-mongodb');

const dataTableLogger = createLogger({
transports:[
// MongoDB transport
    new transports.MongoDB({
        //mongo database connection link
        db : process.env.DATABASE_URL,
        options: {
            useUnifiedTopology: true
        },
        // A collection to save json formatted logs
        collection: 'datatables_activity',
        format: format.combine(
        format.metadata(),
        // Convert logs to a json format
        format.json())
    })]
})

const usersLogger = createLogger({
    transports:[
    // MongoDB transport
        new transports.MongoDB({
            //mongo database connection link
            db : process.env.DATABASE_URL,
            options: {
                useUnifiedTopology: true
            },
            // A collection to save json formatted logs
            collection: 'users_activity',
            format: format.combine(
            format.metadata(),
            // Convert logs to a json format
            format.json())
        })]
    })

module.exports = {
    dataTableLogger: dataTableLogger,
    usersLogger: usersLogger
}