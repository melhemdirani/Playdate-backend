import { Router } from "express";
import { auth, validateRequest } from "../../middleware";
import { createMatchRequestSchema } from "./matchRequestSchema";
import {
  createMatchRequestHandler,
  getMatchRequestsHandler,
} from "./matchRequestController";

const router = Router();

export default router;
