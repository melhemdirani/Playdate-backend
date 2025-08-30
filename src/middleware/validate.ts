import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodArray, z } from "zod";

type Property = "body" | "query" | "params";
export const validateRequest =
  (schema: z.ZodSchema, property: Property) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property as keyof Request]);
    if (result.success) {
      next();
    } else {
      const missingFields = result.error.issues
        .map((issue) => issue.path.join("."))
        .join(" and ");
      const errorMessage = `Missing ${missingFields}`;
      console.log("error", errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  };

//need a validator for array of objects in body

export const validateArrayRequest =
  (schema: ZodArray<AnyZodObject>, property: Property) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property as keyof Request]);
    if (result.success) {
      next();
    } else {
      next(result.error);
    }
  };
