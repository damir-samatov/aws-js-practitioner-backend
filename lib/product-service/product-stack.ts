import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ProductService} from "./product-service";

export class ProductStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        new ProductService(this, 'product-service');
    }
}