import express from "express";
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

  app.post("/scrape", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        throw new HttpError(400, "Bad Request: inusfficient login data");
      }
      const { avatar, ...data } = await scrape(username, password);
      res.json({ status: "ok", ...data });
    } catch (e) {
      console.error(e);
      if (e instanceof HttpError) {
        res.status(e.code);
        res.json({ status: "error", error: e.code, message: e.message });
      } else {
        res.status(500);
        res.json({ status: "error", error: 500 });
      }
    }
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT);
    server.on("error", reject);
    server.on("listening", resolve);
  });
}
