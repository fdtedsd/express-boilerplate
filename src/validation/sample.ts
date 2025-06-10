import { NextFunction, Request, Response } from "express"
import { z } from "zod/v4"

const schema = z.object({
  id: z.uuid()
})

export function validateId(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.body

  try {
    schema.parse({ id })
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send({
        error: error.issues
      })
    }
    else {
      res.status(500).send({
        error: {
          message: "An unexpected error occurred while validating the ID."
        }
      })
    }
    return
  }

  next()
}
