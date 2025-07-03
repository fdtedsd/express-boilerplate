import { envs } from "../config/env"
import { instance } from "../utils/logger"
import { conflictMessage, errorMessage, successMessage, unauthorizedMessage } from "../utils/response"

import { type Request, type Response } from "express"
import jwt from "jsonwebtoken"
import { Auth } from "src/services/cognito"

const logger = instance("Auth Controller")

export async function refresh(req: Request, res: Response): Promise<void> {
  logger.info("refresh called")
  const { sub, refreshToken } = req.body
  logger.appendKeys({ sub, refreshToken })
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  })

  try {
    const data = await auth.refreshToken(sub, refreshToken)

    if (data?.$metadata?.httpStatusCode === 200) {
      const response = {
        requestId: data?.$metadata?.requestId,
        accessToken: data?.AuthenticationResult?.AccessToken,
        refreshToken: data?.AuthenticationResult?.RefreshToken
      }
      logger.info("successfully refreshed token")
      successMessage(res, "authenticated", response)
    }
    else {
      logger.warn("unable to refresh", { data })
      const response = {
        requestId: data?.$metadata?.requestId
      }
      unauthorizedMessage(res, "unauthorized", response)
    }
  }
  catch (e) {
    logger.error("error at refresh", e as Error)
    errorMessage(`${e}`, res)
  }
  logger.resetKeys()
}

export async function signIn(req: Request, res: Response): Promise<void> {
  logger.info("signIn called")
  const { username, password } = req.body
  logger.appendKeys({ username })
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  })

  try {
    const data = await auth.signin(username, password)

    if (data?.metadata?.httpStatusCode === 200) {
      let sub
      if (data?.result?.IdToken) {
        logger.info("authenticated")
        try {
          const decoded = jwt.decode(data.result.IdToken)
          sub = decoded?.sub
          logger.appendKeys({ sub })
        }
        catch (err) {
          logger.error("Failed to decode IdToken payload", err as Error)
        }
      }

      const response = {
        requestId: data?.metadata?.requestId,
        sub,
        idToken: data?.result?.IdToken,
        accessToken: data?.result?.AccessToken,
        refreshToken: data?.result?.RefreshToken,
        hash: data?.hash
      }
      logger.info("successful response")
      successMessage(res, "authenticated", response)
    }
    else {
      logger.warn("unable to authenticate", { data })
      const response = {
        requestId: data?.metadata?.requestId
      }
      unauthorizedMessage(res, "unauthorized", response)
    }
  }
  catch (e) {
    logger.error("error at refresh", e as Error)
    errorMessage(`${e}`, res)
  }
  logger.resetKeys()
}

export async function signUp(req: Request, res: Response): Promise<void> {
  logger.info("signUp called")
  const { email, password } = req.body
  logger.appendKeys({ email })
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  })

  try {
    const userData = await auth.createUser(email)
    if (userData?.metadata?.httpStatusCode === 200) {
      logger.info("account created")
      if (userData?.sub) {
        logger.appendKeys({ sub: userData.sub })
        await auth.setPassword(email, password, true)
        logger.info("password updated")
      }

      const response = {
        requestId: userData?.metadata.requestId,
        sub: userData?.sub
      }
      successMessage(res, "user created", response)
    }
    else {
      logger.warn("unable to create user", { data: userData })
      const response = {
        requestId: userData?.metadata?.requestId
      }
      conflictMessage(res, "unable to create the user", response)
    }
  }
  catch (e) {
    logger.error("error at refresh", e as Error)
    errorMessage(`${e}`, res)
  }
  logger.resetKeys()
}

export async function setPassword(req: Request, res: Response): Promise<void> {
  logger.info("setPassword called")
  const { email, password } = req.body
  logger.appendKeys({ email })
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  })

  try {
    await auth.setPassword(email, password, true)
    logger.info("password updated")
    successMessage(res, "password updated", {})
  }
  catch (e) {
    logger.error("error at refresh", e as Error)
    errorMessage(`${e}`, res)
  }
  logger.resetKeys()
}
