const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
//  ми перенаправлеляємо з іншого раутера в цей і щоб можливо було читати параметри з перенаправленого раута
// в даному випадку з tourRoutes, ми вказуемо параметр - mergeParams: true
// POST /tour/dfs4343fsg2/reviews
// GET /tour/dfs4343fsg2/reviews
// POST /reviews

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourAndUserIDs, reviewController.createReview);

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;