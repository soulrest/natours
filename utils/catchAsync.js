module.exports = fn => {
    return (req, res, next) => {
        // fn(req, res, next).catch(err => next(err));
        // простіше можна написати так як вказано нижче. робить те саме
        fn(req, res, next).catch(next);
    };
};