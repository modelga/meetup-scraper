import { Page } from "puppeteer";
import { ConfigType } from "../application";
import { UserType } from "../types";

const englishDateRegex = /^([A-Z][a-z]+) ([(1-3]?[0-9]), ([0-9]{4})$/;

async function getDataFromProfilePage(page: Page): Promise<[any, any]> {
  await page.click("#profileNav");
  await page.click("#nav-account-links a[href*='members']");
  await page.waitFor("span.memName");

  const [name, since] = await Promise.all([
    page.evaluate(() => {
      return (document.querySelector("span.memName") as HTMLElement).innerText;
    }),
    page.evaluate(() => {
      const since = document.querySelectorAll(".D_memberProfileContentItem")[1].querySelector("p").innerText;
      return since;
    }),
  ]);
  const [_, month, day, year] = englishDateRegex.exec(since);
  const member_since = new Date(`${day} ${month} ${year}`);
  return [name, member_since];
}

async function getDataFromSettingsPage(page: Page): Promise<[number, string]> {
  await page.click("#profileNav");
  await page.click("#nav-account-links a[href*='account']");

  await page.waitFor(() => {
    return [...document.querySelectorAll("h2")].find((el) => el.innerText === "General");
  });

  return Promise.all([
    page.evaluate(() => {
      const cells = [...document.querySelectorAll("td")];
      const idFieldnameCell = cells.find((el) => el.innerText.includes("User ID"));
      const idValueCell = idFieldnameCell.closest("tr").querySelectorAll("td")[1];
      const value = idValueCell.innerText.replace("user", "").replace("edit", "").trim();
      return parseInt(value, 10);
    }),
    page.evaluate(() => {
      const cells = [...document.querySelectorAll("td")];
      const idFieldnameCell = cells.find((el) => el.innerText.includes("Email address"));
      const idValueCell = idFieldnameCell.closest("tr").querySelectorAll("td")[1];
      return idValueCell.innerText.replace("edit", "").trim();
    }),
  ]);
}

export function user(config: ConfigType): (page: Page, close: () => Promise<void>) => Promise<UserType> {
  return async function (page, close) {
    await page.goto(config.MEETUP_URL);

    await page.waitForSelector("#headerAvatar");

    const [full_name, member_since] = await getDataFromProfilePage(page);
    const [meetup_user_id, email] = await getDataFromSettingsPage(page);

    await close();

    return {
      email: email,
      meetup_user_id,
      member_since,
      full_name,
    };
  };
}
