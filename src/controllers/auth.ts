import { Auth } from "src/services/cognito"
import { logger } from "../utils/logger"
import { conflictMessage, errorMessage, successMessage, unauthorizedMessage } from "../utils/response"

import { type Request, type Response } from "express"
import { envs } from "../config/env"
import jwt from "jsonwebtoken";

export async function refresh(req: Request, res: Response): Promise<void> {
  logger.info("[refresh controller] called")
  const { sub, refreshToken } = req.body
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  });

  try {
    const data = await auth.refreshToken(sub, refreshToken);

    if (data?.$metadata?.httpStatusCode === 200) {
      const response = {
        requestId: data?.$metadata?.requestId,
        accessToken: data?.AuthenticationResult?.AccessToken,
        refreshToken: data?.AuthenticationResult?.RefreshToken
      }
      successMessage(res, "authenticated", response)
    } else {
      logger.warn(JSON.stringify(data))
      const response = {
        requestId: data?.$metadata?.requestId
      }
      unauthorizedMessage(res, "unauthorized", response)
    }
  }
  catch (e) {
    logger.error(e)
    errorMessage(`${e}`, res)
  }
}

export async function signIn(req: Request, res: Response): Promise<void> {
  logger.info("[signIn controller] called")
  const { username, password } = req.body
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  });

  try {
    const data = await auth.signin(username, password);

    if (data?.metadata?.httpStatusCode === 200) {
      let sub;
      if (data?.result?.IdToken) {
        try {
          const decoded = jwt.decode(data.result.IdToken);
          sub = decoded?.sub;
        } catch (err) {
          logger.error("Failed to decode IdToken payload: " + err);
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
      successMessage(res, "authenticated", response)
    } else {
      logger.warn(JSON.stringify(data))
      const response = {
        requestId: data?.metadata?.requestId
      }
      unauthorizedMessage(res, "unauthorized", response)
    }
  }
  catch (e) {
    logger.error(e)
    errorMessage(`${e}`, res)
  }
}

export async function signUp(req: Request, res: Response): Promise<void> {
  logger.info("[controller] signUp called")
  const { email, password } = req.body
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  });

  try {
    const userData = await auth.createUser(email);
    if (userData?.metadata?.httpStatusCode === 200) {
      logger.info('account created')
      let passwordData;
      if (userData?.sub) {
        passwordData = await auth.setPassword(email, password, true)
        logger.info('password updated')
      }

      const response = {
        requestId: userData?.metadata.requestId,
        sub: userData?.sub
      }
      successMessage(res, "user created", response)
    } else {
      logger.warn(JSON.stringify(userData))
      const response = {
        requestId: userData?.metadata?.requestId
      }
      conflictMessage(res, "unable to create the user", response)
    }
  }
  catch (e) {
    logger.error(e)
    errorMessage(`${e}`, res)
  }
}

export async function setPassword(req: Request, res: Response): Promise<void> {
  logger.info("[controller] setPassword called")
  const { email, password } = req.body
  const auth = new Auth({
    clientId: envs.COGNITO.CLIENT_ID,
    poolId: envs.COGNITO.POOL_ID,
    secret: envs.COGNITO.CLIENT_SECRET
  });

  try {
    const response = await auth.setPassword(email, password, true)
    logger.info('password updated')
    successMessage(res, "password updated", {})
  }
  catch (e) {
    logger.error(e)
    errorMessage(`${e}`, res)
  }
}