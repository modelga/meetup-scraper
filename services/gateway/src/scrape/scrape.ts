import axios from "axios";
import HttpError from "../HttpError";
import { isAxiosError } from "./helpers";
import { AvatarType, EventType, GroupType, UserType, ScrapedData } from "./types";
import { RequestData } from "./index";

function ScrapeResource(requestData: RequestData) {
  return async function <T>(key: keyof ScrapedData): Promise<T | HttpError> {
    try {
      const { data } = await axios.post<T>(`http://meetup-scrape/${key}`, requestData);
      return data;
    } catch (err) {
      // intentionally return Errors to return partial success
      if (isAxiosError(err)) {
        return new HttpError(err?.response.status || 500, err.message);
      }
      console.error(err);
      return new HttpError(500, "Fatal Error");
    }
  };
}
export async function scrapeUserData(requestData: RequestData): Promise<ScrapedData> {
  const scraper = ScrapeResource(requestData);
  const [user, events, groups, avatar] = await Promise.all([
    scraper<UserType>("user"),
    scraper<EventType[]>("events"),
    scraper<GroupType[]>("groups"),
    scraper<AvatarType>("avatar"),
  ]);
  return { user, events, groups, avatar };
}
