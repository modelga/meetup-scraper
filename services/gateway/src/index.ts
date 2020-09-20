import { ConfigType, start } from "./application";
const { PORT } = process.env;
export const MEETUP_URL = "https://meetup.com";

const config: ConfigType = {
  PORT: parseInt(PORT, 10) || 80,
};

start(config)
  .then(() => {
    console.log(`Gateway app is working at port=${config.PORT}`);
  })
  .catch((err) => {
    console.log("Critical error");
    console.error(err);
    process.exit(1);
  });
