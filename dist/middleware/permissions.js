"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorized = void 0;
const errors_1 = require("../errors");
const isAuthorized = (...roles) => {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        if (process.env.AUTH === 'false') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            throw new errors_1.UnAuthorizedError('You are not authorized to access this route');
        }
        next();
    };
};
exports.isAuthorized = isAuthorized;
