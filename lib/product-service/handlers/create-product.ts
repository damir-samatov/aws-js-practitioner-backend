import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {v4 as uuid} from "uuid";
import {z} from "zod";
import {createResponse} from "../../../shared/utils";

const dynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const dynamoDBDocClient = DynamoDBDocument.from(dynamoDBClient);

export const createProduct: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event, context) => {
    try {
        console.log("Event: ", event);
        console.log("Context: ", context);

        if (!event.body) {
            return createResponse(400, {
                data: {
                    message: "Request body is required",
                },
            });
        }

        const body = JSON.parse(event.body);

        const id = uuid();

        await dynamoDBDocClient.transactWrite({
            TransactItems: [
                {
                    Put: {
                        TableName: process.env.PRODUCT_TABLE_NAME,
                        Item: {
                            id,
                            title: body.title,
                            description: body.description,
                            price: body.price,
                        },
                    },
                },
                {
                    Put: {
                        TableName: process.env.STOCK_TABLE_NAME,
                        Item: {
                            product_id: id,
                            count: body.count,
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
        console.error("Error:", error);

        if (error instanceof z.ZodError) {
            return createResponse(400, {data: {message: error.message}});
        }

        return createResponse(500, {data: {message: "Internal server error"}});
    }
};