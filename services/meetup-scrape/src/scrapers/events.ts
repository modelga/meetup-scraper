import { Page } from "puppeteer";
import { ConfigType } from "../application";
import { EventType } from "../types";

function normalizeType(
  e: Omit<EventType, "start_date"> & {
    start_date: string;
  }
): EventType {
  return { ...e, start_date: new Date(e.start_date) };
}
async function getEvents(page: Page) {
  return await page.evaluate(() => {
    return [...document.querySelectorAll("li[itemtype='http://data-vocabulary.org/Event']")].map((el) => {
      const start_date = (el.querySelector("time[itemprop='startDate']") as HTMLTimeElement)?.dateTime;
      const organization = el.querySelector("div[itemtype='http://data-vocabulary.org/Organization']") as HTMLElement;
      const group_id = organization
        .querySelector("a")
        .href.split("/")
        .filter((p) => p)
        .pop();

      const event_id = (el.querySelector("a.event") as HTMLAnchorElement).href
        .split("/")
        .filter((p) => p)
        .pop();
      const event_name = (el.querySelector("a.event span[itemprop='name']") as HTMLElement).innerText;
      return { event_name, event_id, start_date, group_id };
    });
  });
}

export async function events(config: ConfigType, page: Page): Promise<EventType[]> {
  await page.goto(config.MEETUP_URL);
  await page.waitForSelector("#headerAvatar");
  const events = await getEvents(page);
  return events.map(normalizeType);
}
