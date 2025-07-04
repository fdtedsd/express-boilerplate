import { instance } from "../utils/logger"
import { PACKAGE_VERSION } from "../version"

import { NextFunction, Request, Response } from "express"

const logger = instance("Controller")

export function health(req: Request, res: Response, next: NextFunction): void {
  logger.info("health called")
  const body = {
    version: PACKAGE_VERSION,
    message: "Backend is fine!"
  }

  res.status(200).send(body)

  return next()
}
