import Axios, { AxiosError } from "axios";
import axios from "axios";
import hash from "hash.js";
import randomatic from "randomatic";

import HttpError from "./HttpError";

function isAxiosError(err: any): err is AxiosError {
  return err.isAxiosError;
}

export default async function (username: string, password: string) {
  const processId = `${randomatic("Aa0", 6)}-${randomatic("Aa0", 4)}`;
  const hashValue = hash.sha512().update(`${username}:${password}`).digest("hex");

  try {
    const { data: cookies } = await axios.post("http://meetup-login", {
      hash: hashValue,
      username,
      password,
      processId,
    });
    const requestData = { cookies, hash: hashValue, processId };

    const scrapedData = await Promise.all(scrapeUserData(requestData));
    const [user, events, groups, avatar] = scrapedData.map((r) => r.data);
    return { user, events, groups, avatar, processId };
  } catch (err) {
    console.log(err);
    if (err.response && isAxiosError(err)) {
      throw new HttpError(err?.response?.status, err?.response?.data?.message);
    } else {
      if (err.code === "ECONNREFUSED") {
        throw new HttpError(503, "Service Unavailable");
      }
    }
    throw new HttpError(500, err.message);
  }
}

type ScrapedData = Promise<any>;

function scrapeUserData(requestData: { cookies: any; hash: string; processId: string }): readonly ScrapedData[] {
  return ["user", "events", "groups", "avatar"]
    .map((i) => axios.post(`http://meetup-scrape/${i}`, requestData))
    .map((p) =>
      p.catch((err) => {
        console.log(err);
        return { data: null };
      })
    );
}
