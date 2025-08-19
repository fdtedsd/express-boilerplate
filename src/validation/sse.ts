import { type NextFunction, type Request, type Response } from "express"
import { z } from "zod"

const broadcastBodySchema = z.object({
    message: z.string().min(1, "Message must not be empty"),
    type: z.string().optional()
})

const sendBodySchema = z.object({
    message: z.string().min(1, "Message must not be empty"),
    type: z.string().optional()
})

const connectionIdParamsSchema = z.object({
    connectionId: z.string().min(1, "ConnectionId is required")
})

export function validateBroadcastBody(req: Request, res: Response, next: NextFunction): void {
    try {
        broadcastBodySchema.parse(req.body)
        next()
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).send({ error: error.issues })
        }
        else {
            res.status(500).send({ error: { message: "Unexpected error validating broadcast body." } })
        }
    }
}

export function validateSendRequest(req: Request, res: Response, next: NextFunction): void {
    try {
        connectionIdParamsSchema.parse(req.params)
        sendBodySchema.parse(req.body)
        next()
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).send({ error: error.issues })
        }
        else {
            res.status(500).send({ error: { message: "Unexpected error validating send request." } })
        }
    }
}


