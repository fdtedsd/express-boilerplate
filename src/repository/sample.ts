import { db } from "../utils/db"
import { logger } from "../utils/logger"

type SampleDB = {
  id: string
  name: string
  created_at: Date
  updated_at: Date
}

type SampleResponse = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export class SampleRepository {
  tableName: string
  constructor() {
    this.tableName = "myTable"
  }

  static mapResponse(data?: SampleDB): SampleResponse | undefined {
    if (!data) {
      return undefined
    }
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getSampleById(id: string) {
    logger.info(`[SampleRepository] Fetching sample with ID: ${id}`)
    try {
      const result = await db(this.tableName)
        .select("*")
        .where(id)
        .first()

      return SampleRepository.mapResponse(result)
    }
    catch (error) {
      logger.error(`[SampleRepository] Error fetching sample with ID ${id}: ${error}`)
      throw error
    }
  }
}
