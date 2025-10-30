import {aws_sqs, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ProductService} from "./product-service";

export class ProductStack extends Stack {
    public readonly createBatchProductsSqs: aws_sqs.Queue;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const productService = new ProductService(this, 'product-service');

        this.createBatchProductsSqs = productService.createBatchProductsSqs;
    }
}