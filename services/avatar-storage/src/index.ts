import { ConfigType, start } from "./application";
const { PORT, STORE_PATH } = process.env;

const config: ConfigType = {
  PORT: parseInt(PORT, 10) || 80,
  STORE_PATH,
};

start(config)
  .then(() => {
    console.log(`Avatar-storage app is working at port=${config.PORT}`);
  })
  .catch((err) => {
    console.log("Critical error");
    console.error(err);
    process.exit(1);
  });
