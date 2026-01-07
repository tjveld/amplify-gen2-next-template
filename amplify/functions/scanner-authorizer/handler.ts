
// amplify/functions/auth-function/handler.ts
import type {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const key = event.queryStringParameters?.key;
  const allowed = typeof key === "string" && key.length > 0;

  return {
    principalId: allowed ? "authorized" : "unauthorized",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allowed ? "Allow" : "Deny",
          Resource: event.methodArn,
        },
      ],
    },
    context: { keyPresent: String(allowed) },
  };
};