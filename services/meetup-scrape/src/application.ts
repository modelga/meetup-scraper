import express from "express";
import bodyParser from "body-parser";
import puppeteer, { Cookie } from "puppeteer";
import incognitoRunner from "./incognitoRunner";

import { ScrapeType } from "./types";
import * as allScrapers from "./scrapers";

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

type ScraperFunction = (p: puppeteer.Page, close: () => Promise<void>) => Promise<ScrapeType>;

export async function start(config: ConfigType) {
  const browser = await puppeteer.launch({
    slowMo: 35,
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });
  const app = express();
  app.use(bodyParser.json());
  app.post("/:type(groups|events|user|avatar)", async (req, res) => {
    const scrapers: Record<RequestType, (c: ConfigType) => ScraperFunction> = allScrapers;
    try {
      const cookies = req.body.cookies as Cookie[];
      const scraper = scrapers[req.params.type as RequestType];
      if (scraper) {
        console.log(`Preparing incognito mode for scraper=${req.params.type}`);
        const data = await incognitoRunner(browser, cookies, scraper(config));
        console.log(`Done scraping for scraper=${req.params.type}`);
        res.send(data);
      } else {
        throw new Error("Invalid request");
      }
    } catch (err) {
      console.error(err);
      res.status(500);
      res.send(err);
    }
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(config.PORT);
    server.on("error", reject);
    server.on("listening", resolve);
  });
}
