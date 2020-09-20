import puppeteer from "puppeteer";
import { CaptchaSolver } from "./solveCaptcha";

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
    throw new Error(e);
  }
}

export function LoginUserOnMeetup(browser: puppeteer.Browser, captchaSolver: CaptchaSolver) {
  return async (url: string, email: string, password: string) => {
    console.log("Logging to meetup");
    const context = await browser.createIncognitoBrowserContext();
    let cookies;
    try {
      const page = await context.newPage();
      const ua = await browser.userAgent();
      await page.setUserAgent(ua.replace("Headless", ""));
      await page.goto(url);
      console.log("Going to login page");

      await page.click("a[href*=login]");
      await page.waitForSelector("#email");
      await page.waitForSelector("#loginFormSubmit");
      await page.type("#email", email);
      await page.type("#password", password);

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
        console.log(e);
        throw new Error("Unable to login");
      } finally {
        await page.close();
        await context.close();
      }
    } catch (err) {
      console.error(err);
      await context.close();
      throw err;
    }
  };
}
