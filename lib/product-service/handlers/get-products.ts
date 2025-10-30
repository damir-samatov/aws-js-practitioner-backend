import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {createResponse} from "../../../shared/utils";
import {ENV_MISSING_ERROR, INTERNAL_SERVER_ERROR} from "../../../shared/constants";

const client = new DynamoDBClient({region: process.env.AWS_REGION});
const dynamoDBDocClient = DynamoDBDocument.from(client);

export const getProducts: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
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
        const productsResult = await dynamoDBDocClient.scan({
            TableName: process.env.PRODUCT_TABLE_NAME,
        });

        if (!productsResult.Items?.length) {
            return createResponse(200, []);
        }

        const stocksResult = await dynamoDBDocClient.scan({
            TableName: process.env.STOCK_TABLE_NAME,
        });

        const stockMap = new Map();

        if (stocksResult.Items?.length) {
            stocksResult.Items.forEach((stock) => {
                stockMap.set(stock.product_id, stock.count);
            });
        }

        const productsWithStock = productsResult.Items.map((product) => ({
            ...product,
            count: stockMap.get(product.id) ?? 0,
        }));

        return createResponse(200, productsWithStock);
    } catch (error) {
        console.error("Error:", error);

        return createResponse(500, {message: INTERNAL_SERVER_ERROR});
    }
};