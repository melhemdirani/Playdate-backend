"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.createTokenForUser = exports.hashToken = exports.generateTokens = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const authService_1 = require("../modules/user/authService");
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_LIFETIME,
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload, jti) => {
    return jsonwebtoken_1.default.sign({
        ...payload,
        jti,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_LIFETIME,
    });
};
exports.generateRefreshToken = generateRefreshToken;
const generateTokens = (payload, jti) => {
    return {
        accessToken: (0, exports.generateAccessToken)(payload),
        refreshToken: (0, exports.generateRefreshToken)(payload, jti),
    };
};
exports.generateTokens = generateTokens;
const hashToken = (token) => {
    return crypto_1.default.createHash("sha512").update(token).digest("hex");
};
exports.hashToken = hashToken;
const createTokenForUser = async (user) => {
    const uuid = (0, uuid_1.v4)();
    const { accessToken, refreshToken } = (0, exports.generateTokens)({
        id: user.id,
        email: user.email,
        role: user.role,
    }, uuid);
    await (0, authService_1.createRefreshToken)({
        userId: user.id,
        refreshToken: (0, exports.hashToken)(refreshToken),
        jti: uuid,
    });
    return { accessToken, refreshToken };
};
exports.createTokenForUser = createTokenForUser;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    const verify = jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if (!verify) {
        return false;
    }
    return verify;
};
exports.verifyRefreshToken = verifyRefreshToken;
