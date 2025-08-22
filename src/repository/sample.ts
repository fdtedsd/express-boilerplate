import { db } from "@/utils/db"
import { instance } from "@/utils/logger"

const logger = instance("repository.sample")

type SampleDB = {
  id: string
  name: string
  created_at: Date
  updated_at: Date
}

type SampleDTO = {
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

  static mapResponse(data?: SampleDB): SampleDTO | undefined {
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
    logger.appendKeys({ id })
    logger.info("getSampleById called")
    try {
      const result = await db(this.tableName)
        .select("*")
        .where(id)
        .first()

      return SampleRepository.mapResponse(result)
    }
    catch (error) {
      logger.error("error fetching sample", { error })
      throw error
    }
    finally {
      logger.resetKeys()
    }
  }
}
