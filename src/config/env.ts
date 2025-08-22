import "dotenv/config"
import { type LogLevel } from "@aws-lambda-powertools/logger/lib/cjs/types/Logger"

export const envs = {
  DB_CLIENT: process.env.DB_CLIENT ?? "pg",
  DB_HOST: process.env.DB_HOST as string,
  DB_USER: process.env.DB_USER as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_DATABASE: process.env.DB_DATABASE as string,
  DB_PORT: parseInt(process.env.DB_PORT ?? "5432", 10),
  LOG_LEVEL: (process.env.LOG_LEVEL ?? "INFO") as LogLevel,
  APP_PORT: parseInt(process.env.APP_PORT ?? "3000", 10),
  APP_NAME: process.env.APP_NAME ?? "my-app",
  KNEX_ENV: process.env.KNEX_ENV ?? "local",
  HEARTBEAT_INTERVAL_MS: parseInt(process.env.HEARTBEAT_INTERVAL_MS ?? "30000", 10)
}
