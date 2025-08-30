"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordByToken = exports.forgotPassword = exports.revokeAllRefreshTokens = exports.revokeRefreshToken = exports.findRefreshTokenById = exports.createRefreshToken = void 0;
const utils_1 = require("../../utils");
const db_1 = require("../../db/db");
const errors_1 = require("../../errors");
const usersSchema_1 = require("./usersSchema");
async function createRefreshToken({ userId, refreshToken, jti, }) {
    const token = await db_1.prisma.refreshToken.create({
        data: {
            id: jti,
            token: refreshToken,
            userId,
        },
    });
    return token;
}
exports.createRefreshToken = createRefreshToken;
async function findRefreshTokenById(id) {
    const token = await db_1.prisma.refreshToken.findUnique({
        where: {
            id,
        },
    });
    if (!token) {
        throw new errors_1.NotFoundError("Refresh token not found");
    }
    return token;
}
exports.findRefreshTokenById = findRefreshTokenById;
async function revokeRefreshToken(id) {
    const token = await db_1.prisma.refreshToken.update({
        where: {
            id,
        },
        data: {
            revoked: true,
        },
    });
    return token;
}
exports.revokeRefreshToken = revokeRefreshToken;
async function revokeAllRefreshTokens(userId) {
    const tokens = await db_1.prisma.refreshToken.updateMany({
        where: {
            userId,
        },
        data: {
            revoked: true,
        },
    });
    return tokens;
}
exports.revokeAllRefreshTokens = revokeAllRefreshTokens;
async function forgotPassword(email) {
    const user = await db_1.prisma.user.findUnique({ where: { email: email } });
    if (!user) {
        throw new errors_1.NotFoundError("User not found");
    }
    const token = (0, utils_1.generateCode)();
    const fiveMinutes = 5 * 60 * 1000;
    const expiresAt = new Date(Date.now() + fiveMinutes);
    await db_1.prisma.forgotPassword.create({
        data: { token, expiresAt, userId: user.id },
    });
    await (0, utils_1.sendEmail)({
        to: user.email || "",
        subject: "Reset your Play Date password",
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; color: #333;">
      <h2>Hi ${user.name},</h2>
      <p>We received a request to reset the password for your <strong>Play Date</strong> account.</p>
      <p>If you made this request, click the button below to set a new password:</p>
      <a href="${process.env.FRONTEND_URL}/resetPassword?token=${token}&user=${user.id}" 
         style="display: inline-block; padding: 12px 20px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Reset Password
      </a>
      <p style="margin-top: 20px;">Alternatively, you can manually enter the following code:</p>
      <h1 style="font-size: 36px; color: #007bff; text-align: center; margin-top: 20px;">${token}</h1>
      <p style="margin-top: 20px;">If you didn’t request this, you can safely ignore this email.</p>
      <hr style="margin: 30px 0;" />
      <p style="font-size: 14px; color: #777;">Need help? Contact us at support@playdate.app</p>
      <p style="font-size: 14px; color: #777;">– The Play Date Team</p>
    </div>
  `,
        text: `Hi ${user.name},

We received a request to reset your Play Date password.

Click the link below to reset it:
${process.env.FRONTEND_URL}/resetPassword?token=${token}&user=${user.id}

Alternatively, you can manually enter the following code: ${token}

If you didn’t request this, you can ignore this message.

– The Play Date Team`,
    });
    // await sendSMS({
    //   to: user.phone as string,
    //   body: `<a href="https://educify.org/#/resetPassword?token=${token}&token2=${user.id}">Please click here to reset your password</a>`,
    // });
}
exports.forgotPassword = forgotPassword;
async function resetPasswordByToken(data) {
    const { token, password, userId } = data;
    const forgotPassword = await db_1.prisma.forgotPassword.findUnique({
        where: {
            userId_token: {
                userId,
                token,
            },
        },
    });
    if (!forgotPassword) {
        throw new errors_1.NotFoundError("Token not found");
    }
    if (forgotPassword.expiresAt < new Date()) {
        throw new errors_1.BadRequestError("Token expired");
    }
    const hashedPassword = (0, utils_1.hashPassword)(password);
    await db_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
        select: usersSchema_1.userSelection,
    });
    await db_1.prisma.forgotPassword.update({
        where: { id: forgotPassword.id },
        data: { expiresAt: new Date() },
    });
    return true;
}
exports.resetPasswordByToken = resetPasswordByToken;
