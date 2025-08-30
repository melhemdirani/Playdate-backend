import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export const client = twilio(accountSid, authToken);

export const sendSMS = async ({ to, body }: { to: string; body: string }) => {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    return message;
  } catch (error) {
    console.log('error sending sms', error);
    return error;
  }
};

export async function sendReminderMessage(
  to: string,
  body: string,
  lessonTime: Date
) {
  const message = {
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body
  };

  try {
    const sms = await client.messages.create({
      ...message,
      sendAt: lessonTime
    });
    console.log(`Reminder message sent to ${sms.to}`);
  } catch (error) {
    console.error(error);
  }
}
