import { getMatchRequests } from "./matchRequestService";

export const getMatchRequestsHandler = async (req: Request, res: Response) => {
  try {
    const matchRequests = await getMatchRequests();
    res.status(200).json({ matchRequests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch match requests." });
  }
};
import { Request, Response } from "express";
import { createMatchRequest } from "./matchRequestService";

export const createMatchRequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const matchRequest = await createMatchRequest(req.body, req.user.id);
    res.status(201).json({ matchRequest });
  } catch (error) {
    res.status(500).json({ message: "Failed to create match request." });
  }
};
