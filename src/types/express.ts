import type { Request } from "express"
export type { Request, Response, NextFunction } from "express"
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

export interface ValidatedRequest<T = unknown> extends AuthenticatedRequest {
  input?: T
}