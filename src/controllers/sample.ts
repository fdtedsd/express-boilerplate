import { SampleRepository } from "../repository/sample"
import { instance } from "../utils/logger"
import { errorMessage, successMessage } from "../utils/response"

import type { Request, Response } from "express"

const logger = instance("Controller")
const repo = new SampleRepository()

export async function getSampleById(req: Request, res: Response): Promise<void> {
  logger.info("getSampleById called")
  const { id } = req.body
  logger.appendKeys({ id })
  try {
    const data = await repo.getSampleById(id)
    logger.info('data fetched')
    successMessage(res, "sample fetched successfully", data)
    logger.resetKeys();
  }
  catch (e) {
    logger.error("error at getSampleById", e as Error)
    errorMessage(`${e}`, res)
    logger.resetKeys();
  }
}
