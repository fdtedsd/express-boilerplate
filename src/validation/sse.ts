import { handler } from "../validation"

import type { RequestProperty } from "@/types/validation"
import { z } from "zod"

export const broadcastSchema = z.object({
  content: z.string().min(1, "Message must not be empty"),
  type: z.string().optional()
})

export const messageSchema = z.object({
  content: z.string().min(1, "Message must not be empty"),
  type: z.string().optional()
})

export const connectionIdSchema = z.object({
  connectionId: z.string().min(1, "ConnectionId is required")
})

export const inputSchemaMap = {
  broadcast: [
    {
      schema: broadcastSchema,
      property: "body" as RequestProperty
    }
  ],
  sendToConnection: [
    {
      schema: connectionIdSchema,
      property: "params" as RequestProperty
    },
    {
      schema: messageSchema,
      property: "body" as RequestProperty
    }
  ]
}

export function validate(schema: keyof typeof inputSchemaMap) {
  return handler(inputSchemaMap[schema])
}
