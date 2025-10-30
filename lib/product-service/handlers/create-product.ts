import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {v4 as uuid} from "uuid";
import {z} from "zod";
import {createResponse} from "../../../shared/utils";
import {productCreateDtoSchema} from "../../../shared/create-product-dto-schema";
import {ENV_MISSING_ERROR, INTERNAL_SERVER_ERROR} from "../../../shared/constants";

const dynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const dynamoDBDocClient = DynamoDBDocument.from(dynamoDBClient);

export const createProduct: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event, context) => {
    console.log("Event: ", event);
    console.log("Context: ", context);

    if (
        !process.env.PRODUCT_TABLE_NAME ||
        !process.env.STOCK_TABLE_NAME
    ) {
        throw new Error(ENV_MISSING_ERROR);
    }

    try {
        if (!event.body) {
            return createResponse(400, {
                data: {
                    message: "Request body is required",
                },
            });
        }

        const body: unknown = JSON.parse(event.body);

        const productDto = productCreateDtoSchema.parse(body);

        const id = uuid();

        await dynamoDBDocClient.transactWrite({
            TransactItems: [
                {
                    Put: {
                        TableName: process.env.PRODUCT_TABLE_NAME,
                        Item: {
                            id,
                            title: productDto.title,
                            description: productDto.description,
                            price: productDto.price,
                        },
                    },
                },
                {
                    Put: {
                        TableName: process.env.STOCK_TABLE_NAME,
                        Item: {
                            product_id: id,
                            count: productDto.count,
                        },
                    },
                },
            ],
        });

        return createResponse(201, {
            data: {
                message: "Product created successfully",
                productId: id,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return createResponse(400, {data: {message: error.message}});
        }
        
        console.error("Error:", error);

        return createResponse(500, {message: INTERNAL_SERVER_ERROR});
    }
};