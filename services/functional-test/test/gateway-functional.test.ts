import axios, { AxiosError } from "axios";
import qs from "qs";

describe("gateway basic running test", () => {
  test("should respond with proper data", async () => {
    try {
      const [{ username, password }] = JSON.parse(process.env.ACCOUNTS);
      const form = qs.stringify({ username, password });
      const resp = await axios.post("http://gateway/scrape", form, {
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });
      expect(resp.statusText).toBe("OK");
      expect(resp.status).toBe(200);
      const { status, user, events, groups } = resp.data;
      expect(status).toBe("ok");
      expect(events.length).toBeGreaterThan(0);
      expect(groups.length).toBeGreaterThan(0);
      expect(user.email).toBe(username);
    } catch (err) {
      console.log(err.request);
      throw err;
    }
  });

  test("should error for invalid login", async () => {
    try {
      const form = qs.stringify({ username: "invalid@login.com", password: "no-password" });
      await axios.post("http://gateway/scrape", form, {
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });
      fail(new Error("Logged in for invalid data."));
    } catch (err) {
      const e = err as AxiosError;
      expect(e.response.status).toBe(401);
      expect(e.response.data.error).toBe("invalid_login");
    }
  });
});
