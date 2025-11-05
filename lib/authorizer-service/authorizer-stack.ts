import {aws_lambda, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AuthorizerService} from "./authorizer-service";

export class AuthorizerStack extends Stack {
    public readonly basicAuthorizerLambda: aws_lambda.Function;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const authorizerService = new AuthorizerService(this, "authorizer-service");

        this.basicAuthorizerLambda = authorizerService.basicAuthorizerLambda;
    }
}