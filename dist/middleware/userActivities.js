"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginStatus = exports.LoginMethod = exports.UserActivityType = void 0;
const db_1 = require("../db/db");
// Enum for defining different user activities that you log
var UserActivityType;
(function (UserActivityType) {
    UserActivityType["PROFILE_UPDATE"] = "Profile Update";
    UserActivityType["PROFILE_CREATE"] = "Profile Create";
    UserActivityType["SOCIAL_CREATE"] = "Profile Create";
    UserActivityType["CARD_CREATE"] = "Card Create";
    UserActivityType["CARD_DELETE"] = "Card Delete";
    UserActivityType["CARD_UPDATE"] = "Card Update";
    UserActivityType["CARD_DELETE_FAILED"] = "Card Delete Failed";
    UserActivityType["CARD_CREATE_FAILED"] = "Card Create Failed";
    UserActivityType["CARD_UPDATE_FAILED"] = "Card Update Failed";
    UserActivityType["SOCIAL_CREATE_FAILED"] = "Social Create Failed";
    UserActivityType["PROFILE_CREATE_FAILED"] = "Profile Create Failed";
    UserActivityType["PROFILE_UPDATE_Failed"] = "Profile Update Failed";
    UserActivityType["LOGIN_SUCCESS"] = "Login Success";
    UserActivityType["LOGIN_FAILURE"] = "Login Failure";
    UserActivityType["LOGOUT"] = "Logout";
    // Add more as needed
})(UserActivityType || (exports.UserActivityType = UserActivityType = {}));
// Assuming you have these enums defined based on your authentication strategy
var LoginMethod;
(function (LoginMethod) {
    LoginMethod["JWT"] = "JWT";
    LoginMethod["OAUTH_GOOGLE"] = "OAuth Google";
    // etc.
})(LoginMethod || (exports.LoginMethod = LoginMethod = {}));
var LoginStatus;
(function (LoginStatus) {
    LoginStatus["SUCCESS"] = "Success";
    LoginStatus["FAILURE"] = "Failure";
})(LoginStatus || (exports.LoginStatus = LoginStatus = {}));
async function logUserActivity(logData, userId) {
    // Here, you'd log the activity to your database
    // This function assumes you convert `details` to a string if it's not already a string
    const { activity, details, ipAddress } = logData;
    const detailsToLog = typeof details === "string" ? details : JSON.stringify(details);
    await db_1.prisma.userActivity.create({
        data: {
            userId: userId ? userId : undefined,
            activity,
            details: detailsToLog,
            ipAddress,
        },
    });
}
exports.default = logUserActivity;
// Example usage:
// logUserActivity({
//   userId: 'someUserId',
//   activity: UserActivityType.PROFILE_UPDATE,
//   details: {
//     updatedFields: ['email', 'lastName'],
//     changes: {
//       email: { oldValue: 'old@example.com', newValue: 'new@example.com' },
//       lastName: { oldValue: 'Doe', newValue: 'Smith' },
//     },
//   },
//   ipAddress: '123.123.123.123',
// });
