import { prisma } from "../../db/db";
import { imageSelection } from "../variants/image/imageSchema";
import { GameInput, gameSelection } from "./gameSchema";

export async function createGame(data: GameInput) {
  const { image, ...rest } = data;
  return await prisma.game.create({
    data: {
      ...rest,
      ...(image && {
        image: {
          create: image,
        },
      }),
    },
  });
}

export async function getGames() {
  return await prisma.game.findMany({
    select: {
      name: true,
      image: {
        select: imageSelection,
      },
      id: true,
    },
  });
}

export async function getGameById(id: string) {
  return await prisma.game.findUnique({
    where: {
      id,
    },
  });
}

export async function updateGame(id: string, data: GameInput) {
  const { image, ...rest } = data;
  return await prisma.game.update({
    where: {
      id,
    },
    data: {
      ...rest,
      ...(image && {
        image: {
          upsert: {
            create: image,
            update: image,
          },
        },
      }),
    },
  });
}

export async function deleteGame(id: string) {
  return await prisma.game.delete({
    where: {
      id,
    },
  });
}
