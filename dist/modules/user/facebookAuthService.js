"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookAuthService = void 0;
const db_1 = require("../../db/db");
// import any needed Facebook SDK or validation utils
async function facebookAuthService(token) {
    // TODO: Validate token with Facebook API, get user info
    // For now, mock user info
    const facebookUser = {
        id: "fb123",
        email: "user@example.com",
        name: "Facebook User",
    };
    // Check if user exists
    let user = await db_1.prisma.user.findUnique({ where: { email: facebookUser.email } });
    if (!user) {
        // Create new user
        user = await db_1.prisma.user.create({
            data: {
                email: facebookUser.email,
                name: facebookUser.name,
                bySocial: true,
                // add other fields as needed
            },
        });
    }
    // Generate access and refresh tokens (mocked)
    const accessToken = "mock_access_token";
    const refreshToken = "mock_refresh_token";
    return { accessToken, refreshToken, user };
}
exports.facebookAuthService = facebookAuthService;
