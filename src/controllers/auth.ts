import { envs } from "@/config/env"
import { Auth } from "@/services/cognito"
import type { AuthenticatedRequest } from "@/types/express"
import { instance } from "@/utils/logger"
import { conflictMessage, errorMessage, successMessage, unauthorizedMessage } from "@/utils/response"
import type { Request, Response } from "express"
import jwt from "jsonwebtoken"

const logger = instance("controller.auth")

const auth = new Auth({
  clientId: envs.COGNITO.CLIENT_ID,
  poolId: envs.COGNITO.POOL_ID,
  secret: envs.COGNITO.CLIENT_SECRET,
  region: envs.COGNITO.REGION
})

export async function refresh(req: Request, res: Response): Promise<void> {
  logger.info("refresh called")
  const { sub, refreshToken } = req.body
  logger.appendKeys({ sub, refreshToken })

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
  finally {
    logger.resetKeys()
  }
}

export async function signIn(req: Request, res: Response): Promise<void> {
  logger.info("signIn called")
  const { username, password } = req.body
  logger.appendKeys({ username })

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
  finally {
    logger.resetKeys()
  }
}

export async function signUp(req: Request, res: Response): Promise<void> {
  logger.info("signUp called")
  const { email, password } = req.body
  logger.appendKeys({ email })

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
  finally {
    logger.resetKeys()
  }
}

export async function setPassword(req: Request, res: Response): Promise<void> {
  logger.info("setPassword called")
  const { email, password } = req.body
  logger.appendKeys({ email })

  try {
    await auth.setPassword(email, password, true)
    logger.info("password updated")
    successMessage(res, "password updated", {})
  }
  catch (e) {
    logger.error("error at refresh", e as Error)
    errorMessage(`${e}`, res)
  }
  finally {
    logger.resetKeys()
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { username } = req.body
  logger.appendKeys({ username })
  logger.info("forgotPassword called")

  try {
    const result = await auth.forgotPassword(username)

    if (!result.success) {
      logger.warn("forgotPassword failed", {
        error: result.error,
        requestId: result?.metadata?.requestId,
        result
      })

      if (result.error === "Invalid parameters") {
        successMessage(res, "Invalid parameters", {
          requestId: result?.metadata?.requestId
        })
        return
      }
    }

    successMessage(res, "Request processed", {
      requestId: result?.metadata?.requestId
    })
  }
  catch (e) {
    logger.error("error at forgotPassword", e as Error)
    successMessage(res, "Request processed", {
      requestId: null
    })
  }
  finally {
    logger.resetKeys()
  }
}

export async function resendConfirmationCode(req: Request, res: Response): Promise<void> {
  const { username } = req.body
  logger.appendKeys({ username })
  logger.info("resendConfirmationCode called")

  try {
    const result = await auth.resendConfirmationCode(username)

    if (!result.success) {
      logger.warn("resendConfirmationCode failed", {
        error: result.error,
        requestId: result?.metadata?.requestId,
        result
      })

      if (result.error === "Invalid parameters") {
        successMessage(res, "Invalid parameters", {
          requestId: result?.metadata?.requestId
        })
        return
      }
    }

    successMessage(res, "Request processed", {
      requestId: result?.metadata?.requestId
    })
  }
  catch (e) {
    logger.error("error at resendConfirmationCode", e as Error)
    successMessage(res, "Request processed", {
      requestId: null
    })
  }
  finally {
    logger.resetKeys()
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { username, confirmationCode, newPassword } = req.body
  logger.appendKeys({ username })
  logger.info("resetPassword called")

  try {
    const response = await auth.resetPassword(username, confirmationCode, newPassword)

    if (!response.success) {
      logger.warn("resetPassword failed", {
        error: response.error,
        requestId: response?.metadata?.requestId,
        response
      })

      if (response.error === "Invalid confirmation code") {
        successMessage(res, "Invalid confirmation code", {
          requestId: response?.metadata?.requestId
        })
        return
      }
      if (response.error === "Confirmation code has expired") {
        successMessage(res, "Confirmation code has expired", {
          requestId: response?.metadata?.requestId
        })
        return
      }
    }

    successMessage(res, "Request processed", {
      requestId: response?.metadata?.requestId
    })
  }
  catch (error) {
    logger.error("error at resetPassword", error as Error)
    successMessage(res, "Request processed", {
      requestId: null
    })
  }
  finally {
    logger.resetKeys()
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { previousPassword, proposedPassword } = req.body
  logger.info("changePassword called")
  const accessToken = req.headers.authorization!.replace("Bearer ", "")

  try {
    const data = await auth.changePassword(accessToken, previousPassword, proposedPassword)

    if (data?.success) {
      logger.info("password changed successfully")
      successMessage(res, "password changed", {
        requestId: data?.metadata?.requestId
      })
    }
    else {
      logger.warn("unable to change password", { data })
      const response = {
        requestId: data?.metadata?.requestId,
        error: data?.error
      }
      unauthorizedMessage(res, data?.error || "unable to change password", response)
    }
  }
  catch (e) {
    logger.error("error at changePassword", e as Error)
    errorMessage(`${e}`, res)
  }
  finally {
    logger.resetKeys()
  }
}
