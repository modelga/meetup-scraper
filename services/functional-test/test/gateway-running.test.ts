import axios from "axios";

describe("gateway basic running test", () => {
  test("should respond with simple form on /", async () => {
    const resp = await axios.get("http://gateway");
    expect(resp.statusText).toBe("OK");
    expect(resp.status).toBe(200);
    expect(resp.data).toContain("<form");
    expect(resp.data).toContain("<input");
    expect(resp.data).toContain("</form>");
  });
});
