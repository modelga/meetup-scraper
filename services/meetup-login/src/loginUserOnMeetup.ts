import puppeteer from "puppeteer";
import { CaptchaSolver } from "./solveCaptcha";
import HttpError from "./HttpError";

function isLoginFormDisabled(page: puppeteer.Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.getElementById("loginFormSubmit") as HTMLInputElement | undefined;
    if (el) {
      return el.disabled;
    } else {
      return true;
    }
  });
}
function isErrorDisplayed(page: puppeteer.Page) {
  return page.evaluate(() => !!document.querySelector("div.error"));
}

async function solveCaptcha(page: puppeteer.Page, captchaSolver: CaptchaSolver) {
  console.log("Login input is disabled. Need to solve captcha");
  try {
    await page.waitForSelector("div.g-recaptcha[data-sitekey]", { timeout: 5000 });
    const siteKey = await page.evaluate(() => {
      const el = document.querySelector("div.g-recaptcha[data-sitekey]") as HTMLElement;
      return el.dataset.sitekey;
    });
    const data = await captchaSolver(siteKey, page.url());
    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${data}";`);
    await page.evaluate(`document.getElementById("loginFormSubmit").disabled="";`);
    console.log("Captcha solved");
  } catch (e) {
    console.error(e);
    throw new HttpError(502, "Bad Gateway: Upstream server not responding");
  }
}

export function LoginUserOnMeetup(browser: puppeteer.Browser, captchaSolver: CaptchaSolver) {
  return async (url: string, email: string, password: string) => {
    console.log("Logging to meetup");
    const context = await browser.createIncognitoBrowserContext();
    let cookies;
    try {
      const page = await navigateToMainPage(context, browser, url);

      console.log("Navigating to login page");

      await fillDataInputs(page, email, password);

      if (await isLoginFormDisabled(page)) {
        await solveCaptcha(page, captchaSolver);
      }

      await page.evaluate(`document.getElementById("loginFormSubmit").click();`);
      console.log("Logging in");
      try {
        await page.waitForSelector("a[href*=logout]", { timeout: 10000 });
        cookies = await page.cookies();
        return cookies;
      } catch (e) {
        if (await isErrorDisplayed(page)) {
          throw new HttpError(401, "Bad or missing login data");
        } else {
          console.log(e);
          throw new HttpError(500, "Internal Server Error");
        }
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
    }
  };
}

async function fillDataInputs(page: puppeteer.Page, email: string, password: string) {
  await page.click("a[href*=login]");
  await page.waitForSelector("#email");
  await page.waitForSelector("#loginFormSubmit");
  await page.type("#email", email);
  await page.type("#password", password);
}

async function navigateToMainPage(context: puppeteer.BrowserContext, browser: puppeteer.Browser, url: string) {
  try {
    const page = await context.newPage();
    const ua = await browser.userAgent();
    await page.setUserAgent(ua.replace("Headless", ""));
    await page.goto(url);
    await page.waitForSelector("a[href*=login]");
    return page;
  } catch (err) {
    console.error(err);
    throw new HttpError(503, "Service unavailable");
  }
}
