import {Construct} from 'constructs';
import {aws_apigateway, aws_dynamodb, Duration, RemovalPolicy} from "aws-cdk-lib";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {FRONTEND_URL, PRODUCT_TABLE_NAME, STOCK_TABLE_NAME} from "../../shared/constants";


export class ProductService extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

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

        const getProductsListLambda = new lambda.Function(this, `${id}:get-products`, {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            handler: 'get-products.getProducts',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lib/product-service/handlers')),
            environment: {
                PRODUCT_TABLE_NAME,
                STOCK_TABLE_NAME,
            },
        });

        const getProductByIdLambda = new lambda.Function(this, `${id}:get-product-by-id`, {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            handler: 'get-product-by-id.getProductById',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lib/product-service/handlers')),
            environment: {
                PRODUCT_TABLE_NAME,
                STOCK_TABLE_NAME,
            },
        });

        const createProductLambda = new lambda.Function(this, `${id}:create-product`, {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            handler: 'create-product.createProduct',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lib/product-service/handlers')),
            environment: {
                PRODUCT_TABLE_NAME,
                STOCK_TABLE_NAME,
            },
        });

        productTable.grantReadData(getProductByIdLambda);
        productTable.grantReadData(getProductsListLambda);
        productTable.grantWriteData(createProductLambda);

        stockTable.grantReadData(getProductByIdLambda);
        stockTable.grantReadData(getProductsListLambda);
        stockTable.grantWriteData(createProductLambda);

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