import type { ValidatedRequest } from "@/types/express"
import { InputSchema } from "@/types/validation"
import type { NextFunction, Response } from "express"
import { z } from "zod"

export function handler<T>(inputSchemas: InputSchema[]) {
  return function (req: ValidatedRequest<T>, res: Response, next: NextFunction): void {
    try {
      let input = {}
      for (const { schema, property } of inputSchemas) {
        const parsed = schema.parse(req[property])
        input = { ...input, ...parsed }
      }
      req.input = input as T
      next()
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send({ error: error.issues })
      }
      else {
        res.status(500).send({
          error: {
            message: "An unexpected error occurred while validating the payload."
          }
        })
        return
      }
    }
  }
}
