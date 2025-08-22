import { envs } from "@/config/env"

import { Logger } from "@aws-lambda-powertools/logger"

export const instance = (layer: string) => {
  const loggerInstance = new Logger({
    serviceName: layer,
    logLevel: envs.LOG_LEVEL
  })
  return loggerInstance
}
