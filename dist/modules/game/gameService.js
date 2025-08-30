"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGame = exports.updateGame = exports.getGameById = exports.getGames = exports.createGame = void 0;
const db_1 = require("../../db/db");
const imageSchema_1 = require("../variants/image/imageSchema");
async function createGame(data) {
    const { image, ...rest } = data;
    return await db_1.prisma.game.create({
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
exports.createGame = createGame;
async function getGames() {
    return await db_1.prisma.game.findMany({
        select: {
            name: true,
            image: {
                select: imageSchema_1.imageSelection,
            },
            id: true,
        },
    });
}
exports.getGames = getGames;
async function getGameById(id) {
    return await db_1.prisma.game.findUnique({
        where: {
            id,
        },
    });
}
exports.getGameById = getGameById;
async function updateGame(id, data) {
    const { image, ...rest } = data;
    return await db_1.prisma.game.update({
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
exports.updateGame = updateGame;
async function deleteGame(id) {
    return await db_1.prisma.game.delete({
        where: {
            id,
        },
    });
}
exports.deleteGame = deleteGame;
