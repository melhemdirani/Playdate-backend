import { prisma } from "../db/db";

// General type for logging any user activity
export interface UserActivityLog {
  activity: UserActivityType;
  details?: string | UpdateDetails | LoginAttemptDetails; // Can be a stringified JSON or a specific type
  ipAddress?: string;
  errorMessage?: string;
}

// Enum for defining different user activities that you log
export enum UserActivityType {
  PROFILE_UPDATE = "Profile Update",
  PROFILE_CREATE = "Profile Create",
  SOCIAL_CREATE = "Profile Create",
  CARD_CREATE = "Card Create",
  CARD_DELETE = "Card Delete",
  CARD_UPDATE = "Card Update",
  CARD_DELETE_FAILED = "Card Delete Failed",
  CARD_CREATE_FAILED = "Card Create Failed",
  CARD_UPDATE_FAILED = "Card Update Failed",
  SOCIAL_CREATE_FAILED = "Social Create Failed",
  PROFILE_CREATE_FAILED = "Profile Create Failed",
  PROFILE_UPDATE_Failed = "Profile Update Failed",
  LOGIN_SUCCESS = "Login Success",
  LOGIN_FAILURE = "Login Failure",
  LOGOUT = "Logout",
  // Add more as needed
}

// Specific type for profile update details
export interface UpdateDetails {
  updatedFields: string[]; // List of fields that were updated
  // Optionally include old and new values
  changes?: Record<string, { oldValue: any; newValue: any }>;
}

// Specific type for login attempt details
export interface LoginAttemptDetails {
  method: LoginMethod;
  status: LoginStatus;
}

// Assuming you have these enums defined based on your authentication strategy
export enum LoginMethod {
  JWT = "JWT",
  OAUTH_GOOGLE = "OAuth Google",
  // etc.
}

export enum LoginStatus {
  SUCCESS = "Success",
  FAILURE = "Failure",
}

export default async function logUserActivity(
  logData: UserActivityLog,
  userId?: string
) {
  // Here, you'd log the activity to your database
  // This function assumes you convert `details` to a string if it's not already a string
  const { activity, details, ipAddress } = logData;
  const detailsToLog =
    typeof details === "string" ? details : JSON.stringify(details);
  await prisma.userActivity.create({
    data: {
      userId: userId ? userId : undefined,
      activity,
      details: detailsToLog,
      ipAddress,
    },
  });
}

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
