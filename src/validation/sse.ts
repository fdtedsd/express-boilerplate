import { default as mapValidator } from "../validation/validator"
import { type InputSchemaMap } from "../validation/validator"
import { z } from "zod/v4"

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

export const inputSchemaMap = {
  sendBroadcast: [
    {
      schema: broadcastBodySchema,
      property: "body"
    }
  ],
  sendToId: [
    {
      schema: connectionIdParamsSchema,
      property: "params"
    },
    {
      schema: sendBodySchema,
      property: "body"
    }
  ]
} as InputSchemaMap

export const validate = mapValidator(inputSchemaMap)


