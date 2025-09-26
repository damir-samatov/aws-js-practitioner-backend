import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {ProductLambdaService} from "./product-lambda-service";

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        new ProductLambdaService(this, 'lambda-function');
    }
}