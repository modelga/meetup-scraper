import axios from "axios";
import hash from "hash.js";
import HttpError from "./HttpError";

export default async function (username: string, password: string) {
  const hashValue = hash.sha512().update(`${username}:${password}`).digest("hex");
  try {
    const { data: cookies } = await axios.post("http://meetup-login", { hash: hashValue, username, password });
    const [user, events, groups, avatar] = (
      await Promise.all(
        [
          axios.post("http://meetup-scrape/user", { cookies }),
          axios.post("http://meetup-scrape/events", { cookies }),
          axios.post("http://meetup-scrape/groups", { cookies }),
          axios.post("http://meetup-scrape/avatar", { cookies }),
        ].map((p) =>
          p.catch((err) => {
            console.log(err);
            return null;
          })
        )
      )
    ).map((r) => r?.data);
    return { user, events, groups, avatar };
  } catch (err) {
    throw new HttpError(500, err.message);
  }
}
