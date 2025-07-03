// middlewares/auth.js
import { envs } from "../config/env"
import type { AuthenticatedRequest } from "../types/express"

import { CognitoJwtVerifier } from "aws-jwt-verify"
import type { NextFunction, Response } from "express"

const verifier = CognitoJwtVerifier.create({
  userPoolId: envs.COGNITO.POOL_ID,
  tokenUse: "access",
  clientId: envs.COGNITO.CLIENT_ID
})

export async function auth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" })
    }
    const token = authHeader.replace("Bearer ", "")

    const payload = await verifier.verify(token)

    req.user = {
      sub: payload.sub,
      clientId: payload.client_id,
      iss: payload.iss,
      usage: payload.token_use,
      exp: payload.exp,
      username: payload.username
    }

    next()
  }
  catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return res.status(401).json({ message: "Invalid or expired token", error: errorMessage })
  }
};
