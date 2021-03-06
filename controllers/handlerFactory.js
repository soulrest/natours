const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    };
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    };
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    // const newTour = new Tour(req.body);
    // newTour.save();
    // спосіб вказаний вище робить те саме, але ми створюємо новий тур і на ньому викликаємо метод save.
    // в другому випадку ми на самомій моделі Tour викликаємо метод create
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    // const tour = await Tour.findById(req.params.id).populate({
    //     path: 'guides',
    //     select: '-__v -passwordChangedAt'
    // });
    // const tour = await Tour.findById(req.params.id).populate('guides');
    // .populate('guides') -  оскільки масив guides містьть id які є референсом на іншу схему(модель), за допомогую
    // populate ми заповлюємо ці дані черпаючи їх з іншої схеми, в даному випадку з схеми(моделі)  User
    // populate - можемо використовувати також для того щоб виключати певні поля для показу при запиті, або наупаки вказувати які потрібно відобразити
    // findByID аналогічно можна записати використовуючи інший метод findOne({ _id: req.params.id})
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    };
    // console.log(tour);
    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.params.userId) filter = { user: req.params.userId };
    console.log(filter);
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // const doc = await features.query.explain();
    const doc = await features.query;
    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    });
});