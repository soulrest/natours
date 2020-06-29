const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    // в випадку коли в коді є помилки різного роду: не обявленні змінні та інші помилки що призводять до глобальної помилки в коді,
    // ми використовуемо event на подію - uncaughtException. і вимикаємо сервер, та вказуємо тип помилки
    //  повинен запускати провірку до того як запускати сервер. і до - const app = require('./app');
    console.log('UNCAUGHT EXCEPTION 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    // .connect(process.env.DATABASE_LOCAL, {
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    }).then(() => console.log('BD connection successful! 😊'));

// console.log(app.get('env'));
// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
    // в випадку коли до сервера неможливо підключитися по причині неправельного паролю, тощо
    // ми використовуемо event на подію - unhandledRejection. і вимикаємо сервер, та вказуємо тип помилки
    console.log('UNHANDLED REJECTION 💥 Shutting down...');
    console.log(err.name, err.message);
    // process.exit(0) - success, process.exit(1) - rejected
    server.close(() => {
        process.exit(1);
    });
});