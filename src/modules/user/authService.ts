import { generateCode, hashPassword, sendEmail } from "../../utils";
import { prisma } from "../../db/db";
import { BadRequestError, NotFoundError } from "../../errors";
import { ResetPasswordByTokenInput, userSelection } from "./usersSchema";

export async function createRefreshToken({
  userId,
  refreshToken,
  jti,
}: {
  userId: string;
  refreshToken: string;
  jti: string;
}) {
  const token = await prisma.refreshToken.create({
    data: {
      id: jti,
      token: refreshToken,
      userId,
    },
  });
  return token;
}

export async function findRefreshTokenById(id: string) {
  const token = await prisma.refreshToken.findUnique({
    where: {
      id,
    },
  });
  if (!token) {
    throw new NotFoundError("Refresh token not found");
  }
  return token;
}

export async function revokeRefreshToken(id: string) {
  const token = await prisma.refreshToken.update({
    where: {
      id,
    },
    data: {
      revoked: true,
    },
  });
  return token;
}

export async function revokeAllRefreshTokens(userId: string) {
  const tokens = await prisma.refreshToken.updateMany({
    where: {
      userId,
    },
    data: {
      revoked: true,
    },
  });
  return tokens;
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const token = generateCode();
  const fiveMinutes = 5 * 60 * 1000;
  const expiresAt = new Date(Date.now() + fiveMinutes);
  await prisma.forgotPassword.create({
    data: { token, expiresAt, userId: user.id },
  });

  await sendEmail({
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

export async function resetPasswordByToken(data: ResetPasswordByTokenInput) {
  const { token, password, userId } = data;

  const forgotPassword = await prisma.forgotPassword.findUnique({
    where: {
      userId_token: {
        userId,
        token,
      },
    },
  });

  if (!forgotPassword) {
    throw new NotFoundError("Token not found");
  }

  if (forgotPassword.expiresAt < new Date()) {
    throw new BadRequestError("Token expired");
  }

  const hashedPassword = hashPassword(password);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
    select: userSelection,
  });

  await prisma.forgotPassword.update({
    where: { id: forgotPassword.id },
    data: { expiresAt: new Date() },
  });

  return true;
}
