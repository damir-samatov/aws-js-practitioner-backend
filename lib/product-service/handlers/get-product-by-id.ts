import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {createResponse} from "../../../shared/utils";
import {ENV_MISSING_ERROR, INTERNAL_SERVER_ERROR} from "../../../shared/constants";

const dynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const dynamoDBDocClient = DynamoDBDocument.from(dynamoDBClient);

export const getProductById: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
    event,
    context
) => {
    console.log("Event: ", event);
    console.log("Context: ", context);

    if (
        !process.env.PRODUCT_TABLE_NAME ||
        !process.env.STOCK_TABLE_NAME
    ) {
        throw new Error(ENV_MISSING_ERROR);
    }

    try {
        const productId = event.pathParameters?.productId;

        const productResponse = await dynamoDBDocClient.get({
            TableName: process.env.PRODUCT_TABLE_NAME,
            Key: {
                id: productId,
            },
        });

        if (!productResponse?.Item) {
            return createResponse(404, {
                data: {
                    message: `Product with ID '${productId}' not found`,
                },
            });
        }

        const productStock = await dynamoDBDocClient.get({
            TableName: process.env.STOCK_TABLE_NAME,
            Key: {
                product_id: productId,
            },
        });

        const productWithStock = {
            ...productResponse.Item,
            count: productStock.Item?.count ?? 0,
        };

        return createResponse(200, productWithStock);
    } catch (error) {
        console.error("Error:", error);

        return createResponse(500, {message: INTERNAL_SERVER_ERROR});
    }
};