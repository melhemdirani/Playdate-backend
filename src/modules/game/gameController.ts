import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createGame,
  deleteGame,
  getGameById,
  getGames,
  updateGame,
} from "./gameService";
import { GameInput } from "./gameSchema";

export async function createGameHandler(req: Request, res: Response) {
  const body = req.body as GameInput;
  const game = await createGame(body);
  res.status(StatusCodes.CREATED).json(game);
}

export async function getGamesHandler(req: Request, res: Response) {
  const games = await getGames();
  res.status(StatusCodes.OK).json(games);
}

export async function getGameByIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  const game = await getGameById(id);
  res.status(StatusCodes.OK).json(game);
}

export async function updateGameHandler(req: Request, res: Response) {
  const { id } = req.params;
  const body = req.body as GameInput;
  const game = await updateGame(id, body);
  res.status(StatusCodes.OK).json(game);
}

export async function deleteGameHandler(req: Request, res: Response) {
  const { id } = req.params;
  await deleteGame(id);
  res.status(StatusCodes.NO_CONTENT).send();
}
