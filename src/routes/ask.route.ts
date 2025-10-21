import { NextFunction, Request, Response, Router } from "express";
import { answerQuestion } from "../services/chat.service";

export const askRouter = Router();

askRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, conversationId } = req.body ?? {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "question is required" });
    }

    if (typeof conversationId !== "string" || !conversationId.trim()) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const payload = await answerQuestion(question, conversationId);

    return res.status(200).json({
      answer: payload.answer,
      contexts: payload.contexts.map((item) => ({ id: item.id, text: item.text })),
    });
  } catch (error) {
    return next(error);
  }
});
