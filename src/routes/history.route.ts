import { NextFunction, Request, Response, Router } from "express";
import { getHistory } from "../services/chat.service";

export const historyRouter = Router();

historyRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.query;
    const limitParam = req.query.limit;

    if (typeof conversationId !== "string" || !conversationId.trim()) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const limit = typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : undefined;

    const history = await getHistory(conversationId, limit ?? 20);

    return res.status(200).json({ history });
  } catch (error) {
    return next(error);
  }
});
