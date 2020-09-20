import { Cookie, Browser, Page } from "puppeteer";

function setLanguageToEnglish(cookie: Cookie): Cookie {
  if (cookie.name === "MEETUP_LANGUAGE") {
    return { ...cookie, value: "language=en&country=US" };
  } else {
    return cookie;
  }
}

export default async function <T>(
  browser: Browser,
  cookies: Cookie[],
  fn: (page: Page, close: () => Promise<void>) => Promise<T>
) {
  const incognito = await browser.createIncognitoBrowserContext();
  const page = await incognito.newPage();
  try {
    await page.setCookie(...cookies.map(setLanguageToEnglish));
    return await fn(page, async () => {
      console.log(`Cleaning incognito browser fn=${fn.name}`);
      await page.close();
      await incognito.close();
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}
