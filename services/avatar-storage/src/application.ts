import express, { NextFunction, Request, Response } from "express";
import form from "./templates/form";
import bodyParser from "body-parser";
import HttpError from "./HttpError";
import fs from "fs";
import path from "path";
export type ConfigType = {
  PORT: number;
  STORE_PATH: string;
};

async function saveToPath(location: string, data: string) {
  const buffer = Buffer.from(data, "base64");
  const dir = path.dirname(location);
  await fs.promises.mkdir(dir, { recursive: true });
  return fs.promises.writeFile(location, buffer);
}

const limit_10MB = 1024 * 1024 * 10;

export function start({ PORT, STORE_PATH }: ConfigType) {
  const app = express();
  app.use(bodyParser.json({ limit: limit_10MB }));
  app.get("/", (_, res) => {
    res.send(form());
  });

  app.post("/", async (req, res, next) => {
    try {
      const { avatar, user } = req.body;
      const timestamp = Math.round(Date.now() / 1000);
      const path = `${STORE_PATH}/${timestamp}/${user.meetup_user_id}/${avatar.name}`;
      await saveToPath(path, avatar.data);
      res.send();
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
