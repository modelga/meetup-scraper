import puppeteer from "puppeteer";
import FormData from "form-data";
import axios from "axios";
import poller from "promise-poller";

export type SolveCaptchaConfig = {
  apiKey: string;
  host: string;
};

export function SolveCaptcha({ apiKey, host }: SolveCaptchaConfig) {
  console.log(`Using 2Captcha at host=${host}`);
  function requestCaptchaResults(requestId: string): () => Promise<string> {
    const url = `${host}/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
    return () => {
      return new Promise<string>(async function (resolve, reject) {
        try {
          const { data } = await axios.get(url);
          if (data.status === 0) return reject(data.request);
          resolve(data.request);
        } catch (err) {
          reject(err);
        }
      });
    };
  }

  async function pollForRequestResults(id: string, retries: number = 60, interval: number = 2000) {
    console.log(`Looking for captcha solve id=${id}`);
    return poller({
      taskFn: requestCaptchaResults(id),
      interval,
      retries,
      progressCallback: (retriesRemaining, error) => {
        console.log(`request=${id} attempt=${retries - retriesRemaining} retries=${retries} failed=${error}`);
      },
    });
  }

  async function getCaptchaRequestId(siteKey: string, url: string) {
    const form = new FormData();
    form.append("method", "userrecaptcha");
    form.append("key", apiKey);
    form.append("googlekey", siteKey);
    form.append("pageurl", url);
    form.append("json", 1);
    const { data } = await axios.post(`${host}/in.php`, form, {
      headers: form.getHeaders(),
    });
    return data.request;
  }

  return async function (siteKey: string, url: string) {
    const requestId = await getCaptchaRequestId(siteKey, url);
    const data = await pollForRequestResults(requestId);
    return data;
  };
}
export type CaptchaSolver = (siteKey: string, url: string) => Promise<string>;
