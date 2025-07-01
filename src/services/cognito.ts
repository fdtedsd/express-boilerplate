import { AdminConfirmSignUpCommand, AdminCreateUserCommand, AdminInitiateAuthCommand, AdminSetUserPasswordCommand, AuthFlowType, CognitoIdentityProviderClient, DeliveryMediumType, InitiateAuthCommandOutput, MessageActionType } from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { logger } from "../utils/logger";

export class Auth {
  client: CognitoIdentityProviderClient
  clientId: string
  poolId: string
  secret: string

  constructor(config: any) {
    this.client = new CognitoIdentityProviderClient();
    this.clientId = config.clientId;
    this.poolId = config.poolId;
    this.secret = config.secret
  }

  static getSecretHash(username: string, clientId: string, clientSecret: string): string {
    logger.info(`generating secret hash for ${username}, length: ${username.length}`)
    const hash = createHmac("sha256", clientSecret)
      .update(username + clientId)
      .digest("base64");
    logger.info(`hash: ${hash}`)
    return hash;
  }

  async signin(username: string, password: string) {
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    );

    const input = {
      UserPoolId: this.poolId,
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: {
        "PASSWORD": password,
        "USERNAME": username,
        "SECRET_HASH": secretHash
      },
      ClientId: this.clientId
    };

    const command = new AdminInitiateAuthCommand(input);
    try {
      const response = await this.client.send(command);

      console.log(response)

      return {
        metadata: response.$metadata,
        hash: secretHash,
        result: response.AuthenticationResult
      };
    } catch (e) {
      if ((e as any)?.name === "NotAuthorizedException") {
        console.log(e)
        return {
          metadata: (e as any)?.$metadata
        }
      }
      logger.error(e);
    }
  }

  async refreshToken(username: string, token: string) {
    const secretHash = Auth.getSecretHash(
      username,
      this.clientId,
      this.secret
    );

    console.log(secretHash, secretHash.length)
    console.log(username, username.length)
    console.log(token, token.length)
    console.log('client', this.clientId)
    console.log('pool', this.poolId)

    const input = {
      UserPoolId: this.poolId,
      AuthFlow: AuthFlowType.REFRESH_TOKEN,
      AuthParameters: {
        "SECRET_HASH": secretHash,
        "REFRESH_TOKEN": token,
      },
      ClientId: this.clientId
    };

    const command = new AdminInitiateAuthCommand(input);
    try {
      const response = await this.client.send(command);
      return response;
    } catch (e) {
      if ((e as any)?.name === "NotAuthorizedException") {
        console.log(e)
        return {
          $metadata: (e as any)?.$metadata
        } as InitiateAuthCommandOutput
      }
      logger.error(e);
    }
  }

  async confirmSignUp(username: string) {
    const input = {
      UserPoolId: this.poolId,
      Username: username
    };
    const command = new AdminConfirmSignUpCommand(input);
    const response = await this.client.send(command);
    return response;
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
      DesiredDeliveryMediums: [DeliveryMediumType.EMAIL],
    };
    try {
      const command = new AdminCreateUserCommand(input);
      const response = await this.client.send(command);
      return {
        metadata: response.$metadata,
        sub: response.User?.Username
      }
    } catch (e) {
      if ((e as any)?.name === "UsernameExistsException") {
        console.log(e)
        return {
          metadata: (e as any)?.$metadata
        }
      }
      logger.error(e)
    }
  }

  async setPassword(username: string, password: string, permanent: boolean) {
    const input = { // AdminSetUserPasswordRequest
      UserPoolId: this.poolId,
      Username: username,
      Password: password,
      Permanent: permanent
    };
    const command = new AdminSetUserPasswordCommand(input);
    const response = await this.client.send(command);
    return response;
  }
}

