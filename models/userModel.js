// crypto - вже встроена в node js. не є така дієва і безпечна як bcrypt
const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        // select: false - ніколи не буде виводитися при посиланні даних до клієнта
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // this only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    // якщо пароль не модифікується (міняється) ми не робимо ніяких дій і виходимо з функції
    // this.isModified('password') - даною функцією ми перевіряємо чи модифікувався пароль
    // only run this function if password was actually modified
    if (!this.isModified('password')) return next();
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // нам більше непотрібно поле passwordConfirm. І для видалення поля ми просто встановлюємо його значення в undefined
    // passwordConfirm ми використовуємо для валідації пароля. щоб юзер не помилився при введенні паролю
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    // this.isModified('password') - даною функцією ми перевіряємо чи модифікувався пароль
    // this.isNew - перевіряємо чи документ новий. новостворений
    if (!this.isModified('password') || this.isNew) return next();

    // віднімаємо 1 секунду, томущо деколи буває так що passwordChangedAt міняється швидше що перешкоджує нормальному спрацьовуванню функції що використовують passwordChangedAt
    this.passwordChangedAt = Date.now() - 1000;

    next();
});

// не виводимо в пошуку користувачів з полем active: false
// /^find/ - регулярний вираз щоб фільтрувати всі запити що починаються з find
userSchema.pre(/^find/, function (next) {
    // this - point to the current query
    // this.find({ active: true });
    this.find({ active: { $ne: false } });
    next();
});

//  ми можемо створювати свої методи в обєкті схема за допомогую мотоду  .methods
// оскільки ми вказали password {select: false}  ми не маємо до нього доступу через this.password, тому ми передамо його значення в аргументі функції
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        // міняємо формат та переводимо мілісекунди в секунди поділивши на 1000
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changeTimestamp;
    }

    // False means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // console.log({ resetToken }, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;