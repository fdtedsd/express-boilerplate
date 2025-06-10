import { SampleRepository } from "../repository/sample"
import { logger } from "../utils/logger"
import { errorMessage, successMessage } from "../utils/response"

import type { Request, Response } from "express"

const repo = new SampleRepository()

export async function getSampleById(req: Request, res: Response): Promise<void> {
  logger.info("[getSampleById controller] called")
  const { id } = req.body
  try {
    const data = await repo.getSampleById(id)
    successMessage(res, "sample fetched successfully", data)
  }
  catch (e) {
    logger.error(e)
    errorMessage(`${e}`, res)
  }
}
