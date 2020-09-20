import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import puppeteer, { Cookie } from "puppeteer";
import incognitoRunner from "./incognitoRunner";

import { ScrapeType } from "./types";
import * as allScrapers from "./scrapers";
import HttpError from "./HttpError";

export type ConfigType = {
  PORT: number;
  MEETUP_URL: string;
};

enum RequestType {
  groups = "groups",
  events = "events",
  user = "user",
  avatar = "avatar",
}
const path = "/:type(groups|events|user|avatar)";

type ScraperFunction = (c: ConfigType, p: puppeteer.Page) => Promise<ScrapeType>;
const scrapers: Record<RequestType, ScraperFunction> = allScrapers;

export async function start(config: ConfigType) {
  const browser = await puppeteer.launch({
    slowMo: 35,
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });

  const app = express();
  app.use(bodyParser.json());

  app.post(path, async (req, res, next) => {
    try {
      const cookies = req.body.cookies as Cookie[];
      if (!cookies || cookies.length === 0) {
        throw new HttpError(400, "Invalid request, missing cookies");
      }
      const scraperType = req.params.type as RequestType;

      const scraper = scrapers[scraperType];
      if (!scraper) {
        throw new HttpError(400, `Invalid request, missing scraper=${scraperType}`);
      }

      console.log(`Preparing incognito mode for scraper=${scraperType}`);
      const data = await incognitoRunner(config, browser, cookies, scraper);
      console.log(`Done scraping for scraper=${scraperType}`);
      res.json(data);
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
}
