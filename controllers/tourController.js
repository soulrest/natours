const multer = require('multer');
const sharp = require('sharp');
// const fs = require('fs');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

// multerFilter -  працює як фільтр - де ми фільтруємо/перевіряємо чи загружаємий файл являється кaртинкою
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not image! Please upload only images.', 400), false);
    };
};

// multer middleware дає нам можливість зберігати загружені файли(фото, тощо)
// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// upload.fields() - для загрузки багатьох фотографій
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// приклад
// upload.single('image'); req.file
// upload.array('images', 5); req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    // оскільки у нас не один файл то запрос робиться на req.files
    // якщо файл один - req.file
    // console.log(req.files);

    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    req.body.images = [];
    // виникає проблема коли ми викликаємо async/await в колбек функціїї на ітерації масиву
    // проблема виникає в тому що після закінчення ітераціїї з використанням async/await не викликається  next()
    // і наш масив req.body.images буде пустий
    // тому так працювати не буде. ми повинні викликати await Promise.all() на всій ітерації
    // req.files.images.forEach(async (file, index) => {
    //     const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
    //     await sharp(file.buffer)
    //         .resize(2000, 1333)
    //         .toFormat('jpeg')
    //         .jpeg({ quality: 90 })
    //         .toFile(`public/img/tours/${filename}`);

    //     req.body.images.push(filename);
    // });

    await Promise.all(
        req.files.images.map(async (file, index) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );

    console.log(req.body);
    next();
});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    // console.log(req.query);
    next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // queryObj - використовуємо диструктизацію для створення нового обєкту, а не копіємо референс на обєкт (const queryObj = req.query)
//     // BUILD QUERY
//     // 1A) Filtering
//     // const queryObj = { ...req.query };
//     // const excludeFields = ['page', 'sort', 'limit', 'fields'];
//     // // delete - оператор, полностью удаляет свойство из объекта
//     // excludeFields.forEach(el => delete queryObj[el]);
//     // // console.log('req.query: ', req.query);
//     // // console.log('queryObj: ', queryObj);

//     // // 1B) Advanced Filtering
//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//     // // console.log(JSON.parse(queryStr));
//     // // зробимо replace на таких свойствах обєкта: gte, gt, lte, lt

//     // let query = Tour.find(JSON.parse(queryStr));

//     // 2) Sorting
//     // if (req.query.sort) {
//     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     // console.log(sortBy);
//     //     query = query.sort(sortBy);
//     //     // query.sort('price ratingsAverage')
//     // } else {
//     //     query = query.sort('-createdAt');
//     // };

//     // 3) Field limiting
//     // 127.0.0.1:8000/api/v1/tours?fields=name, duration,price,difficulty
//     // if (req.query.fields) {
//     //     const fields = req.query.fields.split(',').join(' ');
//     //     query = query.select(fields);
//     // } else {
//     //     query = query.select('-__v');
//     // };

//     // 4) Pagination
//     // const page = req.query.page * 1 || 1;
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit;
//     // // 127.0.0.1:8000/api/v1/tours?page=2&limit=10 - 1-10 page 1, 11-20 page 2 and so...
//     // query = query.skip(skip).limit(limit);

//     // if (req.query.page) {
//     //     const numTours = await Tour.countDocuments();
//     //     if (skip >= numTours) throw new Error('This page doesn`n exist');
//     // }

//     // {difficulty: 'easy', duration: {$gte: 5}} -  так ми фільтрцємо пошук обктів в mongodb
//     // 127.0.0.1:8000/api/v1/tours?duration[gte]=5&difficulty=easy&sort=1&limit=10&price[lt]=1500

//     // const tours = Tour.find({
//     //     duration: 5,
//     //     difficulty: 'easy'
//     // });

//     // const tours = Tour.find().where('duration').lte(5).where('difficulty').equals('easy');

//     // const tours = await Tour.find();

//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//     const tours = await features.query;
//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
//     // try {

//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// exports.getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews');
//     // const tour = await Tour.findById(req.params.id).populate({
//     //     path: 'guides',
//     //     select: '-__v -passwordChangedAt'
//     // });
//     // const tour = await Tour.findById(req.params.id).populate('guides');
//     // .populate('guides') -  оскільки масив guides містьть id які є референсом на іншу схему(модель), за допомогую
//     // populate ми заповлюємо ці дані черпаючи їх з іншої схеми, в даному випадку з схеми(моделі)  User
//     // populate - можемо використовувати також для того щоб виключати певні поля для показу при запиті
//     // findByID аналогічно можна записати використовуючи інший метод findOne({ _id: req.params.id})
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     };
//     // console.log(tour);
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//     // const newTour = new Tour(req.body);
//     // newTour.save();
//     // спосіб вказаний вище робить те саме, але ми створюємо новий тур і на ньому викликаємо метод save.
//     // в другому випадку ми на самомій моделі Tour викликаємо метод create
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour
//         }
//     });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     });
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     };
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     };
//     res.status(204).json({
//         status: 'success',
//         data: null
//     });
// });

// aggregation pipeline - за допомогою даного даних функцій mongodb
// ми можемо фільтрувати і будь-яким чином відсортовувати дані з бази даних використовуючи певні методи
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: null,
                // _id: '$difficulty',
                // _id: '$ratingsAverage',
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
        // {
        //     $match: { _id: { $ne: 'EASY' } }
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

// $unwind - розбиває масив на окремі елементи, які переводить в строку і нa виході дає клони кожного елемента базиданих даних
// під окремий елемент масиву
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.112309,-118.114454/unit/mi
//  щоб все працювало, потрібно встановити в моделі індекс - tourSchema.index({ startLocation: '2dsphere' });
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // distance / 3963.2 -  радіус землі в милях в іншому випадку радіус землі в кілометрах
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(new AppError('Please provide latitude and langitude in the format lat, lng.', 400));
    };

    // console.log(distance, lat, lng, unit);
    //  спочатку встановлюємо langitude, а потім latitude
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
        status: 'seccess',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(new AppError('Please provide latitude and langitude in the format lat, lng.', 400));
    };

    // $geoNear is only valid as the first stage in a pipeline.
    // це означає, що якщо в нас є інші aggregation мідлвер функції які зпрацюють швидше від GeoSpecial, ми отримаємо помилку вказану вище
    // GeoSpecial aggregation
    const distances = await Tour.aggregate([
        {
            // geoNear - зайвжди має йти першим кроком
            //  даний момент у нас один GeoSpecial індекс в нашій схемі - tourSchema.index({ startLocation: '2dsphere' });
            // и тому він буде автоматично використовуватися, але якщо їх більше то ми встановлюємо його за допомогою опції keys
            $geoNear: {
                near: {
                    type: 'Point',
                    // [lng * 1, lat * 1] -  множемо на 1 щоб конвертувати їх в  Number
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'seccess',
        data: {
            data: distances
        }
    });
});