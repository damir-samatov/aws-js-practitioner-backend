import {APIGatewayTokenAuthorizerHandler} from "aws-lambda";
import {ENV_MISSING_ERROR} from "../../../shared/constants";

export const basicAuthorizer: APIGatewayTokenAuthorizerHandler = async (
    event,
    context
) => {
    console.log("Event: ", event);
    console.log("Context: ", context);

    if (!process.env.TOKEN) {
        throw new Error(ENV_MISSING_ERROR)
    }

    const token = event.authorizationToken;

    if (!token) {
        throw new Error("Unauthorized");
    }

    const base64token = token.replace("Basic ", "");

    if (base64token === process.env.TOKEN) {
        return {
            principalId: 'damir',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: event.methodArn,
                    },
                ],
            },
        };
    } else {
        return {
            principalId: 'damir',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: event.methodArn,
                    },
                ],
            },
        };
    }
}