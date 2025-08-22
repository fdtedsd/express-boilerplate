import type { ZodObject } from "zod"
export type RequestProperty = "body" | "params" | "query"

export type InputSchema = {
  schema: ZodObject
  property: RequestProperty
}
export type InputSchemaMap = Record<string, InputSchema[]>
