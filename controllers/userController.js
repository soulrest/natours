const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// diskStorage - зберігає файл на диск
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//         // null - перший аргумент можемо вказувати error або якщо ми не обробляємо помилку - вказуємо null 
//     },
//     filename: (req, file, cb) => {
//         // user-(ID)dfmskm43mmvsvm33f-(timestamp)3434223232.jpeg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

// збереже файл в буфер, завдяки чому він буде для нас доступний req.file.buffer \ ми зможемо його використовавати
// да маніпулювати конкретним файлом в функціях middleware тощо
// 
// Эта «зона ожидания» и есть буфер! Физическим представлением буфера может являться пространство в 
// оперативной памяти, где данные, при работе с потоком, временно накапливаются, 
// ждут своей очереди, и в итоге отправляются на обработку.
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

// upload.single('photo') - для загрузки однієї фотографії
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    //  коли ми зберігаємо файл в буфер memoryStorage, то req.file.filename ще не існує - не визначений
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//     const users = await User.find();
//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: users.length,
//         data: {
//             users
//         }
//     });
// });

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password update. Please use /updateMyPassword', 400));
    }
    // const user = await User.findById(req.user.id);
    // user.name = "Jonas";
    // save() не буде працювати в даному випадку оскільки в нас є графи в DB з параметром required
    // await user.save()
    // console.log(user);
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// ми не видаляємо користувача з бази даних, а лише декстивуємо - міняємо поле в БД на active: false
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    console.log(req.body);
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined! Please use /signup instead'
    });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);