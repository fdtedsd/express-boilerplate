import { logger } from "../utils/logger"
import { PACKAGE_VERSION } from "../version"

import { NextFunction, Request, Response } from "express"

export function health(req: Request, res: Response, next: NextFunction): void {
  logger.info("Called Healthcheck")
  const body = {
    version: PACKAGE_VERSION,
    message: "Backend is fine!"
  }

  res.status(200).send(body)

  return next()
}
