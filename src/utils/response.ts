import type { Response } from "express"

export function successMessage(res: Response, msg: string, data?: Record<string, unknown>) {
  try {
    return res.status(200).send({
      message: msg,
      data
    })
  }
  catch (e) {
    console.log(e)
  }
}

export function unauthorizedMessage(res: Response, msg: string, data?: Record<string, unknown>) {
  try {
    return res.status(401).send({
      message: msg,
      data
    })
  }
  catch (e) {
    console.log(e)
  }
}

export function conflictMessage(res: Response, msg: string, data?: Record<string, unknown>) {
  try {
    return res.status(409).send({
      message: msg,
      data
    })
  }
  catch (e) {
    console.log(e)
  }
}

export function unprocessableMessage(res: Response, msg: string, data?: Record<string, unknown>) {
  try {
    return res.status(422).send({
      message: msg,
      data
    })
  }
  catch (e) {
    console.log(e)
  }
}

export function errorMessage(msg: string, res: Response) {
  try {
    return res.status(500).send({
      error: {
        message: msg
      }
    })
  }
  catch (e) {
    console.log(e)
  }
}
