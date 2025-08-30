import { Router } from "express";
import { validateRequest, auth, isAuthorized } from "../../middleware";
import { gameSchema } from "./gameSchema";
import {
  createGameHandler,
  deleteGameHandler,
  getGameByIdHandler,
  getGamesHandler,
  updateGameHandler,
} from "./gameController";

const router = Router();

router.route("/").get(getGamesHandler).post(
  // auth,
  // isAuthorized("ADMIN"),
  validateRequest(gameSchema, "body"),
  createGameHandler
);

router
  .route("/:id")
  .get(getGameByIdHandler)
  .patch(
    auth,
    // isAuthorized("ADMIN"),
    validateRequest(gameSchema, "body"),
    updateGameHandler
  )
  .delete(auth, isAuthorized("ADMIN"), deleteGameHandler);

export default router;
