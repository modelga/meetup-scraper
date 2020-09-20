import { Cookie, Browser, Page } from "puppeteer";
import { ConfigType } from "./application";
import { ScrapeType } from "./types";

function setLanguageToEnglish(cookie: Cookie): Cookie {
  if (cookie.name === "MEETUP_LANGUAGE") {
    return { ...cookie, value: "language=en&country=US" };
  } else {
    return cookie;
  }
}

export default async function <T>(
  config: ConfigType,
  browser: Browser,
  cookies: Cookie[],
  fn: (c: ConfigType, page: Page) => Promise<T>
) {
  const incognito = await browser.createIncognitoBrowserContext();
  const page = await incognito.newPage();
  try {
    await page.setCookie(...cookies.map(setLanguageToEnglish));
    return await fn(config, page);
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    console.log(`Cleaning incognito browser fn=${fn.name}`);
    await page.close();
    await incognito.close();
  }
}
