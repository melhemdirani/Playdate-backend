"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReminderMessage = exports.sendSMS = exports.client = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
exports.client = (0, twilio_1.default)(accountSid, authToken);
const sendSMS = async ({ to, body }) => {
    try {
        const message = await exports.client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
        return message;
    }
    catch (error) {
        console.log('error sending sms', error);
        return error;
    }
};
exports.sendSMS = sendSMS;
async function sendReminderMessage(to, body, lessonTime) {
    const message = {
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body
    };
    try {
        const sms = await exports.client.messages.create({
            ...message,
            sendAt: lessonTime
        });
        console.log(`Reminder message sent to ${sms.to}`);
    }
    catch (error) {
        console.error(error);
    }
}
exports.sendReminderMessage = sendReminderMessage;
