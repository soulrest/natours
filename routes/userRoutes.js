const express = require('express');
const userController = require('./../controllers/userController');
// const { getUser, updateUser, getAllUsers, deleteUser } = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const bookingRouter = require('../routes/bookingRoutes');

const router = express.Router();

router.use('/:userId/bookings', bookingRouter);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// router.use(authController.protect) - приміниться до всіх раутів що йдуть нижче
// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);
// multer middleware дає нам можливість зберігати загружені файли(фото, тощо)
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
//  хоча насправід ми не видаляємо користувача з бази даних. це нормально використовувати HTTP method - delete
router.delete('/deleteMe', userController.deleteMe);

// Protect all routes after this middleware
router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router;