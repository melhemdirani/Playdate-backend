"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const gameSchema_1 = require("./gameSchema");
const gameController_1 = require("./gameController");
const router = (0, express_1.Router)();
router.route("/").get(gameController_1.getGamesHandler).post(
// auth,
// isAuthorized("ADMIN"),
(0, middleware_1.validateRequest)(gameSchema_1.gameSchema, "body"), gameController_1.createGameHandler);
router
    .route("/:id")
    .get(gameController_1.getGameByIdHandler)
    .patch(middleware_1.auth, 
// isAuthorized("ADMIN"),
(0, middleware_1.validateRequest)(gameSchema_1.gameSchema, "body"), gameController_1.updateGameHandler)
    .delete(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), gameController_1.deleteGameHandler);
exports.default = router;
