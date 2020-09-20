import Axios from "axios";
import axios from "axios";
import hash from "hash.js";
import randomatic from "randomatic";
import HttpError from "../HttpError";
import { reduceToRemoveErrors, Dictionary, isAxiosError } from "./helpers";
import { login } from "./login";
import { scrapeUserData } from "./scrape";

import { ScrapedData } from "./types";

export type RequestData = { cookies: any; hash: string; processId: string };

export default async function (username: string, password: string) {
  const processId = `${randomatic("Aa0", 6)}-${randomatic("Aa0", 4)}`;
  const hashValue = hash.sha512().update(`${username}:${password}`).digest("hex");

  try {
    const { data: cookies } = await login(hashValue, username, password, processId);

    const scrapedData = await scrapeUserData({ cookies, hash: hashValue, processId });
    const { avatar, ...toResponse } = scrapedData;

    const { errors, succeed } = checkForErrors(scrapedData);
    try {
      if (!errors.includes("avatar") && !errors.includes("user")) {
        await axios.post("http://avatar-storage", { avatar, user: toResponse.user });
      }
    } catch (err) {
      console.log("failed avatar", err.message);
    }

    const cleanFailedParts = errors.reduce(reduceToRemoveErrors, {} as Dictionary) as {};

    return {
      processId,
      ...toResponse,
      errors,
      succeed,
      ...cleanFailedParts,
    };
  } catch (err) {
    handleError(err);
  }
}

function checkForErrors(scrapedData: ScrapedData) {
  const errors = Object.entries(scrapedData)
    .filter((item) => item[1] instanceof HttpError)
    .map(([key]) => key);

  const succeed = Object.entries(scrapedData)
    .filter((item) => !(item[1] instanceof HttpError))
    .map(([key]) => key);

  errors.forEach((key) => {
    console.log(scrapedData[key as keyof Omit<ScrapedData, "avatar">]);
  });
  return { errors, succeed };
}

function handleError(err: any) {
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
