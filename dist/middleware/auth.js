"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// export async function auth(req: Request, res: Response, next: NextFunction) {
//   return next();
//   if (process.env.NODE_ENV === 'test') {
//     return next();
//   }
//   const token = req.signedCookies.token;
//   try {
//     const payload = jwt.verify(
//       token,
//       process.env.JWT_ACCESS as string
//     ) as JwtPayload;
//     req.user = {
//       id: payload.id,
//       email: payload.email,
//       role: payload.role
//     };
//     next();
//   } catch (error) {
//     throw new UnAuthenticatedError(
//       'You are not authorized to access this route'
//     );
//   }
// }
async function auth(req, res, next) {
    var _a;
    if (process.env.NODE_ENV === "test") {
        return next();
    }
    if (process.env.AUTH === "false") {
        return next();
    }
    const authorization = (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a.authorization;
    if (!authorization) {
        return res
            .status(401)
            .json({ message: "No authorization header provided" });
    }
    const token = authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        // Since 'error' is of type 'unknown', use type assertion if you want to access specific properties
        console.log("error", error);
        const errorMessage = error instanceof Error ? error.message : "Invalid token provided";
        return res.status(401).json({ message: errorMessage });
    }
}
exports.auth = auth;
exports.default = auth;
