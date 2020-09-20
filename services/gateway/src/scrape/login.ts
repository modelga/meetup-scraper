import axios from "axios";

export async function login(
  hashValue: string,
  username: string,
  password: string,
  processId: string
): Promise<{ data: any }> {
  return await axios.post("http://meetup-login", {
    hash: hashValue,
    username,
    password,
    processId,
  });
}
