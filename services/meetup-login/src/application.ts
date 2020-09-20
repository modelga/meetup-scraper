import puppeteer from "puppeteer";
import express, { Request, Response, NextFunction } from "express";
import { LoginUserOnMeetup } from "./loginUserOnMeetup";
import { SolveCaptcha } from "./solveCaptcha";
import bodyParser from "body-parser";
import Redis from "ioredis";
import HttpError from "./HttpError";
export type ConfigType = {
  HEADLESS: boolean;
  MEETUP_URL: string;
  PORT: number;
  REDIS_URL: string;
  TWO_CAPTCHA_API_KEY: string;
  TWO_CAPTCHA_HOST: string;
};

export const start = async (config: ConfigType) => {
  process.env.PUPPETEER_CHROMIUM_REVISION = "";
  const browser = await puppeteer.launch({
    slowMo: 25,
    headless: config.HEADLESS,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });

  const { TWO_CAPTCHA_API_KEY, TWO_CAPTCHA_HOST } = config;
  const captchaSolver = SolveCaptcha({ apiKey: TWO_CAPTCHA_API_KEY, host: TWO_CAPTCHA_HOST });
  const login = LoginUserOnMeetup(browser, captchaSolver);
  const redis = new Redis(config.REDIS_URL);

  const app = express();
  app.use(bodyParser.json());

  app.post("/", async (req, res, next) => {
    try {
      const { username: email, password, hash } = req.body;
      const cachedCookies = await redis.get(hash);
      if (cachedCookies) {
        res.send(JSON.parse(cachedCookies));
      } else {
        const cookies = await login(config.MEETUP_URL, email, password);
        redis.setex(hash, 3600 * 5, JSON.stringify(cookies));
        res.send(cookies);
      }
    } catch (err) {
      next(err);
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
    const server = app.listen(config.PORT);
    server.on("error", reject);
    server.on("listening", resolve);
  });
};
