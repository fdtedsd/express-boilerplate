import { NextFunction, Request, Response } from "express"
import { z } from "zod"

const signInSchema = z.object({
  username: z.email(),
  password: z.string()
})

const refreshSchema = z.object({
  sub: z.string(),
  refreshToken: z.string()
})

export function validateSignIn(req: Request, res: Response, next: NextFunction): void {
  const payload = req.body

  try {
    signInSchema.parse(payload)
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
          message: "An unexpected error occurred while validating the payload."
        }
      })
    }
    return
  }
  next()
}

export function validateRefresh(req: Request, res: Response, next: NextFunction): void {
  const payload = req.body

  try {
    refreshSchema.parse(payload)
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
          message: "An unexpected error occurred while validating the payload."
        }
      })
    }
    return
  }
  next()
}
