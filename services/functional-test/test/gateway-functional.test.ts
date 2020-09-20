import axios from "axios";
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
});
