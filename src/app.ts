import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error";
import { askRouter } from "./routes/ask.route";
import { historyRouter } from "./routes/history.route";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/ask", askRouter);
app.use("/history", historyRouter);

app.use(errorHandler);

export default app;
