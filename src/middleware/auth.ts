import { UnAuthenticatedError } from "../errors";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

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

export async function auth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  if (process.env.AUTH === "false") {
    return next();
  }

  const authorization = req?.headers?.authorization;

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
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    // Since 'error' is of type 'unknown', use type assertion if you want to access specific properties
    const errorMessage =
      error instanceof Error ? error.message : "Invalid token provided";
    return res.status(401).json({ message: errorMessage });
  }
}

export default auth;
