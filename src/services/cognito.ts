import { createHmac } from "crypto"

import { AuthConfig } from "@/types/auth"
import { instance } from "@/utils/logger"
import {
  AdminConfirmSignUpCommand,
  AdminCreateUserCommand,
  AdminCreateUserCommandOutput,
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandOutput,
  AdminSetUserPasswordCommand,
  AuthFlowType,
  ChangePasswordCommand,
  ChangePasswordCommandInput,
  ChangePasswordCommandOutput,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandOutput,
  DeliveryMediumType,
  ForgotPasswordCommand,
  ForgotPasswordCommandOutput,
  InitiateAuthCommandOutput,
  MessageActionType,
  ResendConfirmationCodeCommand,
  ResendConfirmationCodeCommandOutput
} from "@aws-sdk/client-cognito-identity-provider"

const logger = instance("service.cognito")

export class Auth {
  client: CognitoIdentityProviderClient
  clientId: string
  poolId: string
  secret: string

  constructor(config: AuthConfig) {
    this.client = new CognitoIdentityProviderClient({
      region: config.region
    })
    this.clientId = config.clientId
    this.poolId = config.poolId
    this.secret = config.secret
  }

  static getSecretHash(username: string, clientId: string, clientSecret: string): string {
    logger.appendKeys({ username, clientId })
    logger.info(`getSecretHash called`)
    const hash = createHmac("sha256", clientSecret)
      .update(username + clientId)
      .digest("base64")
    logger.info("hash generated", { hash })
    return hash
  }

  async signin(username: string, password: string) {
    logger.appendKeys({ username })
    logger.info(`signin called`)
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    )

    const input = {
      UserPoolId: this.poolId,
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: {
        PASSWORD: password,
        USERNAME: username,
        SECRET_HASH: secretHash
      },
      ClientId: this.clientId
    }

    const command = new AdminInitiateAuthCommand(input)
    try {
      const response = await this.client.send(command)
      logger.info("signin successful")
      return {
        metadata: response.$metadata,
        hash: secretHash,
        result: response.AuthenticationResult
      }
    }
    catch (e) {
      if ((e as Error)?.name === "NotAuthorizedException") {
        logger.warn("NotAuthorizedException", e as Error)
        return {
          metadata: (e as AdminInitiateAuthCommandOutput)?.$metadata
        }
      }
      logger.error("error at signin", e as Error)
    }
  }

  async refreshToken(username: string, token: string) {
    logger.appendKeys({ username })
    logger.info(`refreshToken called`)
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    )

    const input = {
      UserPoolId: this.poolId,
      AuthFlow: AuthFlowType.REFRESH_TOKEN,
      AuthParameters: {
        SECRET_HASH: secretHash,
        REFRESH_TOKEN: token
      },
      ClientId: this.clientId
    }

    const command = new AdminInitiateAuthCommand(input)
    try {
      const response = await this.client.send(command)
      logger.info("refreshToken successful")
      return response
    }
    catch (e) {
      if ((e as Error)?.name === "NotAuthorizedException") {
        logger.warn("NotAuthorizedException", e as Error)
        return {
          $metadata: (e as AdminInitiateAuthCommandOutput)?.$metadata
        } as InitiateAuthCommandOutput
      }
      logger.error("error at refresh token", e as Error)
    }
  }

  async confirmSignUp(username: string) {
    logger.appendKeys({ username })
    logger.info(`confirmSignUp called`)
    const input = {
      UserPoolId: this.poolId,
      Username: username
    }
    const command = new AdminConfirmSignUpCommand(input)
    const response = await this.client.send(command)
    return response
  }

  async createUser(username: string) {
    const input = {
      UserPoolId: this.poolId,
      Username: username,
      UserAttributes: [
        {
          Name: "email",
          Value: username
        }
      ],
      MessageAction: MessageActionType.SUPPRESS,
      DesiredDeliveryMediums: [DeliveryMediumType.EMAIL]
    }
    try {
      const command = new AdminCreateUserCommand(input)
      const response = await this.client.send(command)
      return {
        metadata: response.$metadata,
        sub: response.User?.Username
      }
    }
    catch (e) {
      if ((e as Error)?.name === "UsernameExistsException") {
        logger.warn("UsernameExistsException", e as Error)
        return {
          metadata: (e as AdminCreateUserCommandOutput)?.$metadata
        }
      }
      logger.error("error at createUser", e as Error)
    }
  }

  async setPassword(username: string, password: string, permanent: boolean) {
    logger.appendKeys({ username })
    logger.info(`setPassword called`)
    const input = { // AdminSetUserPasswordRequest
      UserPoolId: this.poolId,
      Username: username,
      Password: password,
      Permanent: permanent
    }
    const command = new AdminSetUserPasswordCommand(input)
    const response = await this.client.send(command)
    return response
  }

  async forgotPassword(username: string) {
    logger.appendKeys({ username })
    logger.info(`forgotPassword called`)
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    )

    const input = {
      ClientId: this.clientId,
      Username: username,
      SecretHash: secretHash
    }

    const command = new ForgotPasswordCommand(input)

    try {
      const response = await this.client.send(command)
      return {
        success: true,
        metadata: response.$metadata,
        codeDeliveryDetails: response.CodeDeliveryDetails
      }
    }
    catch (e) {
      if ((e as Error)?.name === "UserNotFoundException") {
        logger.warn("UserNotFoundException", e as Error)
        return {
          success: false,
          error: "User not found",
          metadata: (e as ForgotPasswordCommandOutput)?.$metadata
        }
      }
      if ((e as Error)?.name === "InvalidParameterException") {
        logger.warn("InvalidParameterException", e as Error)
        return {
          success: false,
          error: "Invalid parameters",
          metadata: (e as ForgotPasswordCommandOutput)?.$metadata
        }
      }
      logger.error("error at forgotPassword", e as Error)
      return {
        success: false,
        error: "An unexpected error occurred"
      }
    }
  }

  async resendConfirmationCode(username: string) {
    logger.appendKeys({ username })
    logger.info(`resendConfirmationCode called`)
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    )

    const input = {
      ClientId: this.clientId,
      Username: username,
      SecretHash: secretHash
    }

    const command = new ResendConfirmationCodeCommand(input)

    try {
      const response = await this.client.send(command)
      return {
        success: true,
        metadata: response.$metadata,
        codeDeliveryDetails: response.CodeDeliveryDetails
      }
    }
    catch (e) {
      if ((e as Error)?.name === "UserNotFoundException") {
        logger.warn("UserNotFoundException", e as Error)
        return {
          success: false,
          error: "User not found",
          metadata: (e as ResendConfirmationCodeCommandOutput)?.$metadata
        }
      }

      if ((e as Error)?.name === "InvalidParameterException") {
        logger.warn("InvalidParameterException", e as Error)
        return {
          success: false,
          error: "Invalid parameters",
          metadata: (e as ResendConfirmationCodeCommandOutput)?.$metadata
        }
      }

      logger.error("error at resendConfirmationCode", e as Error)
      return {
        success: false,
        error: "An unexpected error occurred"
      }
    }
  }

  async resetPassword(username: string, confirmationCode: string, newPassword: string) {
    logger.appendKeys({ username })
    logger.info(`resetPassword called`)
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    )

    const input = {
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
      SecretHash: secretHash
    }

    const command = new ConfirmForgotPasswordCommand(input)

    try {
      const response = await this.client.send(command)
      return {
        success: true,
        metadata: response.$metadata
      }
    }
    catch (e) {
      if ((e as Error)?.name === "CodeMismatchException") {
        logger.warn("CodeMismatchException", e as Error)
        return {
          success: false,
          error: "Invalid confirmation code",
          metadata: (e as ConfirmForgotPasswordCommandOutput)?.$metadata
        }
      }
      if ((e as Error)?.name === "ExpiredCodeException") {
        logger.warn("ExpiredCodeException", e as Error)
        return {
          success: false,
          error: "Confirmation code has expired",
          metadata: (e as ConfirmForgotPasswordCommandOutput)?.$metadata
        }
      }
      if ((e as Error)?.name === "UserNotFoundException") {
        logger.warn("UserNotFoundException", e as Error)
        return {
          success: false,
          error: "User not found",
          metadata: (e as ConfirmForgotPasswordCommandOutput)?.$metadata
        }
      }

      logger.error("error at resetPassword", e as Error)
      return {
        success: false,
        error: "An unexpected error occurred"
      }
    }
  }

  async changePassword(accessToken: string, previousPassword: string, proposedPassword: string) {
    logger.info(`changePassword called`)
    const input: ChangePasswordCommandInput = {
      AccessToken: accessToken,
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword
    }

    try {
      const command = new ChangePasswordCommand(input)
      const response = await this.client.send(command)
      return {
        metadata: response.$metadata,
        success: true
      }
    }
    catch (e) {
      if ((e as Error)?.name === "NotAuthorizedException") {
        logger.warn("NotAuthorizedException", e as Error)
        return {
          metadata: (e as ChangePasswordCommandOutput)?.$metadata,
          success: false,
          error: "Not authorized"
        }
      }
      if ((e as Error)?.name === "InvalidPasswordException") {
        logger.warn("InvalidPasswordException", e as Error)
        return {
          metadata: (e as ChangePasswordCommandOutput)?.$metadata,
          success: false,
          error: "Invalid password"
        }
      }
      if ((e as Error)?.name === "PasswordHistoryPolicyViolationException") {
        logger.warn("PasswordHistoryPolicyViolationException", e as Error)
        return {
          metadata: (e as ChangePasswordCommandOutput)?.$metadata,
          success: false,
          error: "Password matches previous password"
        }
      }
      logger.error("error at changePassword", e as Error)
      return {
        metadata: (e as ChangePasswordCommandOutput)?.$metadata,
        success: false,
        error: (e as Error)?.message
      }
    }
  }
}
