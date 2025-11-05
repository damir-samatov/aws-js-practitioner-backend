import * as path from "path";
import {Construct} from "constructs";
import {
    aws_lambda,
    Duration,
} from "aws-cdk-lib";
import {ENV_MISSING_ERROR} from "../../shared/constants";

const DEFAULT_LAMBDA_CONFIG = {
    runtime: aws_lambda.Runtime.NODEJS_20_X,
    memorySize: 1024,
    timeout: Duration.seconds(5),
    code: aws_lambda.Code.fromAsset(path.join(__dirname, '../../dist/lib/authorizer-service/handlers')),
}

export class AuthorizerService extends Construct {
    public readonly basicAuthorizerLambda: aws_lambda.Function;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        if (!process.env.TOKEN) {
            throw new Error(ENV_MISSING_ERROR);
        }

        this.basicAuthorizerLambda = new aws_lambda.Function(this, "basic-authorizer-lambda", {
            ...DEFAULT_LAMBDA_CONFIG,
            handler: "basic-authorizer.basicAuthorizer",
            environment: {
                TOKEN: process.env.TOKEN,
            }
        });
    }
}