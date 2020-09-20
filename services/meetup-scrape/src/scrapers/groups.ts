import { Page } from "puppeteer";
import { ConfigType } from "../application";
import { GroupType } from "../types";

async function getGroups(page: Page): Promise<GroupType[]> {
  return await page.evaluate(() => {
    return [...document.querySelectorAll(".your-mugs .groupCard")].map((el) => {
      const group_name = (el.querySelector("*[itemprop='name']") as HTMLElement).innerText.trim();
      const group_id = el
        .querySelector("a")
        .href.split("/")
        .filter((p) => p)
        .pop();
      return { group_id, group_name };
    });
  });
}

export async function groups(config: ConfigType, page: Page): Promise<GroupType[]> {
  await page.goto(config.MEETUP_URL);
  await page.waitForSelector("#headerAvatar");
  await page.click("#simple-view-selector-group");
  await page.waitFor(() => {
    return [...document.querySelectorAll("h4")].find((el) => el.innerText.toLowerCase().includes("your groups"));
  });

  const groups = await getGroups(page);
  return groups;
}
