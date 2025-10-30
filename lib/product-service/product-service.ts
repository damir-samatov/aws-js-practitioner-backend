import {Construct} from 'constructs';
import {
    aws_apigateway,
    aws_dynamodb,
    aws_lambda,
    aws_sns,
    aws_sns_subscriptions,
    aws_sqs,
    Duration,
    RemovalPolicy
} from "aws-cdk-lib";
import * as path from 'path';
import {
    FRONTEND_URL,
    PRODUCT_TABLE_NAME,
    SNS_CREATE_PRODUCTS_TOPIC_SUBSCRIBERS,
    STOCK_TABLE_NAME
} from "../../shared/constants";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

const DEFAULT_LAMBDA_CONFIG = {
    runtime: aws_lambda.Runtime.NODEJS_20_X,
    memorySize: 1024,
    timeout: Duration.seconds(5),
    code: aws_lambda.Code.fromAsset(path.join(__dirname, '../../dist/lib/product-service/handlers')),
    environment: {
        PRODUCT_TABLE_NAME,
        STOCK_TABLE_NAME,
    },
}

export class ProductService extends Construct {
    public readonly createBatchProductsSqs: aws_sqs.Queue;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.createBatchProductsSqs = new aws_sqs.Queue(this, "create-batch-products-sqs");

        const createProductSns = new aws_sns.Topic(this, "create-product-sns");

        const productTable = new aws_dynamodb.Table(this, "product-table", {
            tableName: PRODUCT_TABLE_NAME,
            partitionKey: {
                name: "id",
                type: aws_dynamodb.AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY
        });

        const stockTable = new aws_dynamodb.Table(this, "stock-table", {
            tableName: STOCK_TABLE_NAME,
            partitionKey: {
                name: "product_id",
                type: aws_dynamodb.AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY
        });

        const getProductsListLambda = new aws_lambda.Function(this, `${id}:get-products`, {
            ...DEFAULT_LAMBDA_CONFIG,
            handler: 'get-products.getProducts',
        });

        const getProductByIdLambda = new aws_lambda.Function(this, `${id}:get-product-by-id`, {
            ...DEFAULT_LAMBDA_CONFIG,
            handler: 'get-product-by-id.getProductById',
        });

        const createProductLambda = new aws_lambda.Function(this, `${id}:create-product`, {
            ...DEFAULT_LAMBDA_CONFIG,
            handler: 'create-product.createProduct',
        });

        const createBatchProductsLambda = new aws_lambda.Function(this, `${id}:create-batch-products-lambda`, {
            ...DEFAULT_LAMBDA_CONFIG,
            environment: {
                ...DEFAULT_LAMBDA_CONFIG.environment,
                PRODUCT_CREATED_SNS_TOPIC_ARN: createProductSns.topicArn,
            },
            handler: "create-batch-products.createBatchProducts",
        });

        SNS_CREATE_PRODUCTS_TOPIC_SUBSCRIBERS.forEach((subscriber) => {
            createProductSns.addSubscription(
                new aws_sns_subscriptions.EmailSubscription(subscriber)
            );
        })

        createProductSns.grantPublish(createBatchProductsLambda);

        productTable.grantReadData(getProductByIdLambda);
        productTable.grantReadData(getProductsListLambda);
        stockTable.grantReadData(getProductByIdLambda);
        stockTable.grantReadData(getProductsListLambda);
        productTable.grantWriteData(createProductLambda);
        productTable.grantWriteData(createBatchProductsLambda);
        stockTable.grantWriteData(createProductLambda);
        stockTable.grantWriteData(createBatchProductsLambda);

        createBatchProductsLambda.addEventSource(new SqsEventSource(this.createBatchProductsSqs, {
            batchSize: 5
        }));

        const api = new aws_apigateway.RestApi(this, "product-service-api", {
            restApiName: "Products Service API",
            defaultCorsPreflightOptions: {
                allowOrigins: [FRONTEND_URL],
                allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
                allowHeaders: ["Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"],
            },
        });

        const productsResource = api.root.addResource("products");
        const productsLambdaIntegration = new aws_apigateway.LambdaIntegration(getProductsListLambda);
        productsResource.addMethod("GET", productsLambdaIntegration);

        const productIdResource = productsResource.addResource("{productId}");
        const productIdLambdaIntegration = new aws_apigateway.LambdaIntegration(getProductByIdLambda);
        productIdResource.addMethod("GET", productIdLambdaIntegration);

        const createProductLambdaIntegration = new aws_apigateway.LambdaIntegration(createProductLambda);
        productsResource.addMethod("PUT", createProductLambdaIntegration);
    }
}