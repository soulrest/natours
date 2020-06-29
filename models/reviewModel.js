// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');
const { findOneAndDelete, findByIdAndDelete } = require('./userModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can`t be empty!']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to user']
    }
},
    {
        toJSON: { vitrtuals: true },
        toObject: { virtuals: true }
    }
);

// за допомогую цього методу кожен юзер(user) зможе додати тільки один коментар(review) до тyру(tour)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
});

//  прораховує середній рейтинг туру та вказує кількість рейтингів
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRatings: { $avg: '$rating' }
            }
        }
    ]);
    // console.log(stats);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRatings
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

// pre post - треба враховувати що перший діє до того як документ(ревю) попадає в колекцію, тобто документа немає в колекції і він не враховується
// post -  немає домтупу до next
reviewSchema.post('save', function () {
    // this points to current review
    // Review.calcAverageRatings(this.tour);
    //  оскільки ми не можемо викликати метод до на класі Review до його створення, ми можемо використати трюк 
    // виклакавши даний метод на його конструкотрі this.constructor
    this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
    // const rev = await this.findOne();
    this.rev = await this.findOne();
    // console.log(this.rev);
    next();
});
// досить дивний спосіб реалізації апдуйта ratingsQuantity та ratingsAverage при Update та Delete
// але реалізувати це можливо в сукупності використовуючи  pre & post middleware
reviewSchema.post(/^findOneAnd/, async function () {
    // await this.findOne(); - does NOT work here, query has already executed
    await this.rev.constructor.calcAverageRatings(this.rev.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;