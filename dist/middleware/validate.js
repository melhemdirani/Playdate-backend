"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateArrayRequest = exports.validateRequest = void 0;
const validateRequest = (schema, property) => async (req, res, next) => {
    const result = schema.safeParse(req[property]);
    if (result.success) {
        next();
    }
    else {
        const missingFields = result.error.issues
            .map((issue) => issue.path.join("."))
            .join(" and ");
        const errorMessage = `Missing ${missingFields}`;
        console.log("error", errorMessage);
        res.status(400).json({ error: errorMessage });
    }
};
exports.validateRequest = validateRequest;
//need a validator for array of objects in body
const validateArrayRequest = (schema, property) => async (req, res, next) => {
    const result = schema.safeParse(req[property]);
    if (result.success) {
        next();
    }
    else {
        next(result.error);
    }
};
exports.validateArrayRequest = validateArrayRequest;
