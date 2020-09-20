import express, { NextFunction, Request, Response } from "express";
import form from "./templates/form";
import bodyParser from "body-parser";
import scrape from "./scrape";
import HttpError from "./HttpError";
export type ConfigType = {
  PORT: number;
};

export function start({ PORT }: ConfigType) {
  const app = express();
  app.use(bodyParser.urlencoded());
  app.get("/", (_, res) => {
    res.send(form());
  });

  app.post("/scrape", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        console.log(username, password);
        throw new HttpError(400, "Bad Request: inusufficient login data");
      }
      const { avatar, ...data } = await scrape(username, password);
      res.json({ status: "ok", ...data });
    } catch (e) {
      next(e);
    }
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    if (err instanceof HttpError) {
      res.status(err.code);
      res.json({ status: "error", error: err.code, message: err.message });
    } else {
      res.status(500);
      res.json({ status: "error", error: 500 });
    }
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT);
    server.on("error", reject);
    server.on("listening", resolve);
  });
}
