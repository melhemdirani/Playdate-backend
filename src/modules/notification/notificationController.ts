import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationAsSeen,
  deleteNotification,
} from "./notificationService";
import {
  CreateNotificationInput,
  UpdateNotificationInput,
} from "./notificationSchema";
import { IToken } from "../../utils";

interface CustomRequest extends Request {
  user: IToken;
}

export const createNotificationHandler = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const notification = await createNotification(
      req.body as CreateNotificationInput
    );
    res.status(StatusCodes.CREATED).json(notification);
  } catch (error) {
    console.error("Error in createNotificationHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to create notification." });
  }
};

export const getNotificationsHandler = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const notifications = await getNotificationsByUserId(userId);
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    console.error("Error in getNotificationsHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to fetch notifications." });
  }
};

export const markNotificationAsSeenHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const notification = await markNotificationAsSeen(id);
    res.status(StatusCodes.OK).json(notification);
  } catch (error) {
    console.error("Error in markNotificationAsSeenHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to mark notification as seen." });
  }
};

export const deleteNotificationHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    await deleteNotification(id);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    console.error("Error in deleteNotificationHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to delete notification." });
  }
};
