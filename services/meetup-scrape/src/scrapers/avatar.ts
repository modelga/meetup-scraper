import { Page } from "puppeteer";
import { ConfigType } from "../application";
import { AvatarType, UserType } from "../types";

async function getAvatarUrl(page: Page): Promise<string> {
  await page.click("#profileNav");
  await page.click("#nav-account-links a[href*='members']");
  await page.waitFor("span.memName");

  return page.evaluate(() => {
    const images = document.querySelector("#member-profile-photo");
    const avatarHighRes = images.querySelector("a");
    return avatarHighRes.href;
  });
}

export function avatar(config: ConfigType): (page: Page, close: () => Promise<void>) => Promise<AvatarType> {
  return async function (page, close) {
    await page.goto(config.MEETUP_URL);
    await page.waitForSelector("#headerAvatar");

    const avatarUrl = await getAvatarUrl(page);
    const nav = page.waitForNavigation({ waitUntil: "networkidle2" });
    const vs = await page.goto(avatarUrl);
    await nav;
    await close();
    return {
      data: (await vs.buffer()).toString("base64"),
      type: vs.headers()["content-type"],
    };
  };
}
