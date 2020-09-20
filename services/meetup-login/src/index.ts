import { ConfigType, start } from "./application";

const { TWO_CAPTCHA_API_KEY, TWO_CAPTCHA_HOST, REDIS_URL, PORT, HEADLESS } = process.env;
export const MEETUP_URL = "https://meetup.com";

const config: ConfigType = {
  TWO_CAPTCHA_API_KEY,
  TWO_CAPTCHA_HOST,
  HEADLESS: HEADLESS !== "false",
  REDIS_URL,
  PORT: parseInt(PORT, 10) || 80,
  MEETUP_URL,
};

start(config)
  .then(() => {
    console.log(`Meetup-login app is working at port=${config.PORT}`);
  })
  .catch((err) => {
    console.log("Critical error");
    console.error(err);
    process.exit(1);
  });
