import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { createRefreshToken } from "../modules/user/authService";

export type IToken = {
  id: string;
  email: string;
  role: string;
};

export const generateAccessToken = (payload: IToken) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_LIFETIME,
  });
};

export const generateRefreshToken = (payload: IToken, jti: string) => {
  return jwt.sign(
    {
      ...payload,
      jti,
    },

    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.JWT_REFRESH_TOKEN_LIFETIME,
    }
  );
};

export const generateTokens = (payload: IToken, jti: string) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload, jti),
  };
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha512").update(token).digest("hex");
};

export const createTokenForUser = async (user: IToken) => {
  const uuid = uuidv4();
  const { accessToken, refreshToken } = generateTokens(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    uuid
  );

  await createRefreshToken({
    userId: user.id,
    refreshToken: hashToken(refreshToken),
    jti: uuid,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
};

export const verifyRefreshToken = (token: string) => {
  const verify = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
  if (!verify) {
    return false;
  }

  return verify as JwtPayload;
};
