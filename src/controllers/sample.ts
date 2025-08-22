import { SampleRepository } from "@/repository/sample"
import { instance } from "@/utils/logger"
import { errorMessage, successMessage } from "@/utils/response"
import type { Request, Response } from "express"

const logger = instance("controller.sample")
const repo = new SampleRepository()

export async function getSampleById(req: Request, res: Response): Promise<void> {
  const { id } = req.body
  logger.appendKeys({ id })
  logger.info("getSampleById called")
  try {
    const data = await repo.getSampleById(id)
    logger.info("data fetched")
    successMessage(res, "sample fetched successfully", data)
  }
  catch (e) {
    logger.error("error at getSampleById", e as Error)
    errorMessage(`${e}`, res)
  }
  finally {
    logger.resetKeys()
  }
}
