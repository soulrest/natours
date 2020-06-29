const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// server side webpage rendering using PUG
// PUG має бути встановленим, але немає потребі в його імпортуванні в файл, оскільки express включає сам автоматично
// з цими 2ма строками нижче ми маэмо встановлений engine PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))

// 1) GLOBAL MIDDLEWARES
// за допомогою данного метода express ми можемо давати доступ сторінці до файлів html ----- http://127.0.0.1:3000/overview.html
// при відкритті URL в браузері ми не вказуємо дерикторію в public, вказуємо конкретній файл який відкриється в браузері 
// http://127.0.0.1:3000/img/pin.png, http://127.0.0.1:3000/overview.html тощо...
// працює лише з статичними файлами
// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//  лімітує запроси на сервер щоб запобігти хакерським атакам
// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'To many requests from this IP. Please try again in an hour.'
});
// буде діяти на наші раути що починаються з /api
app.use('/api', limiter);

// Body parser, reading date from body into req.body
app.use(express.json({ limit: '10kb' }));
// express.urlencoded() - використовується для того щоб обробляти запроси безпосередньо з HTML форми
// This is a built-in middleware function in Express. It parses incoming requests with urlencoded payloads and is based on body-parser.
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS 
app.use(xss());

// Prevent parameter pollution - {{URL}}api/v1/tours?sort=duration&sort=price  де параметри sort задаються не через кому
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// app.use((req, res, next) => {
//     console.log('Hello from the middleware 👋');
//     next();
// });

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) ROUTS
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!`
    // });

    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ERROR handling middleware
app.use(globalErrorHandler);

module.exports = app;