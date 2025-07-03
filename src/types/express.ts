import type { Request } from "express"

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string
    clientId: string
    iss: string
    usage: string
    exp: number
    username: string
  }
}
