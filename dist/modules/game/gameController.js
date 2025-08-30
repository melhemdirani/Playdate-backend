"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGameHandler = exports.updateGameHandler = exports.getGameByIdHandler = exports.getGamesHandler = exports.createGameHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const gameService_1 = require("./gameService");
async function createGameHandler(req, res) {
    const body = req.body;
    const game = await (0, gameService_1.createGame)(body);
    res.status(http_status_codes_1.StatusCodes.CREATED).json(game);
}
exports.createGameHandler = createGameHandler;
async function getGamesHandler(req, res) {
    const games = await (0, gameService_1.getGames)();
    res.status(http_status_codes_1.StatusCodes.OK).json(games);
}
exports.getGamesHandler = getGamesHandler;
async function getGameByIdHandler(req, res) {
    const { id } = req.params;
    const game = await (0, gameService_1.getGameById)(id);
    res.status(http_status_codes_1.StatusCodes.OK).json(game);
}
exports.getGameByIdHandler = getGameByIdHandler;
async function updateGameHandler(req, res) {
    const { id } = req.params;
    const body = req.body;
    const game = await (0, gameService_1.updateGame)(id, body);
    res.status(http_status_codes_1.StatusCodes.OK).json(game);
}
exports.updateGameHandler = updateGameHandler;
async function deleteGameHandler(req, res) {
    const { id } = req.params;
    await (0, gameService_1.deleteGame)(id);
    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
}
exports.deleteGameHandler = deleteGameHandler;
