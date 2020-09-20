import axios, { AxiosError } from "axios";

describe("gateway basic error checks", () => {
  test("should respond with status=404 on GET /scrape", async () => {
    try {
      await axios.get("http://gateway/scrape");
    } catch (err) {
      const e = err as AxiosError;
      expect(e.response.status).toBe(404);
    }
  });

  test("should respond with status=400 on POST /scrape with no data", async () => {
    try {
      await axios.post("http://gateway/scrape");
    } catch (err) {
      const e = err as AxiosError;
      expect(e.response.status).toBe(400);
    }
  });
});
