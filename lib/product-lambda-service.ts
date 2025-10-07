import {Construct} from 'constructs';
import {Duration} from "aws-cdk-lib";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as path from 'path';

const FRONTEND_URL = "https://d2mrs9j21a3h4o.cloudfront.net"

export class ProductLambdaService extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const getProductsListLambda = new lambda.Function(this, `${id}:getProducts`, {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            handler: 'getProducts.main',
            code: lambda.Code.fromAsset(path.join(__dirname, './handlers')),
        });

        const getProductByIdLambda = new lambda.Function(this, `${id}:getProductById`, {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            handler: 'getProductById.main',
            code: lambda.Code.fromAsset(path.join(__dirname, './handlers')),
        });

        const api = new apiGateway.RestApi(this, `${id}:product-service-api`, {
            restApiName: "Product Service API",
            description: "API for Product Service",
            defaultCorsPreflightOptions: {
                allowOrigins: [FRONTEND_URL],
                allowMethods: ["GET"],
            }
        });

        const getProductsListIntegration = new apiGateway.LambdaIntegration(getProductsListLambda, {
            integrationResponses: [
                {
                    statusCode: "200",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Origin": `'${FRONTEND_URL}'`,
                        "method.response.header.Access-Control-Allow-Headers":
                            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
                        "method.response.header.Access-Control-Allow-Methods":
                            "'GET'",
                    }
                }
            ],
            proxy: false,
        });

        const getProductByIdIntegration = new apiGateway.LambdaIntegration(getProductByIdLambda, {
            integrationResponses: [
                {
                    statusCode: "200",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Origin": `'${FRONTEND_URL}'`,
                        "method.response.header.Access-Control-Allow-Headers":
                            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
                        "method.response.header.Access-Control-Allow-Methods":
                            "'GET'",
                    },
                }
            ],
            proxy: false,
        });

        const productsResource = api.root.addResource("products");

        productsResource.addMethod('GET', getProductsListIntegration, {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    "method.response.header.Access-Control-Allow-Origin": true,
                    "method.response.header.Access-Control-Allow-Headers": true,
                    "method.response.header.Access-Control-Allow-Methods": true,
                },
            }]
        });

        const singleProductResource = productsResource.addResource("{productId}");

        singleProductResource.addMethod('GET', getProductByIdIntegration, {
            methodResponses: [
                {
                    statusCode: "200",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Origin": true,
                        "method.response.header.Access-Control-Allow-Headers": true,
                        "method.response.header.Access-Control-Allow-Methods": true,
                    },
                },
            ],
        });
    }
}