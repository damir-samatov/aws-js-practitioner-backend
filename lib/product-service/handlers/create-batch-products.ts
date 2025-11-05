import {SQSHandler} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {
    productCreateCsvDtoSchema,
    ProductCreateDto,
    productCreateDtoSchema
} from "../../../shared/create-product-dto-schema";
import {v4 as uuid} from "uuid";
import {SNS} from "@aws-sdk/client-sns";
import {ENV_MISSING_ERROR} from "../../../shared/constants";

const dynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const dynamoDBDocClient = DynamoDBDocument.from(dynamoDBClient);
const snsClient = new SNS({region: process.env.AWS_REGION});

export const createBatchProducts: SQSHandler = async (
    event,
    context
) => {
    console.log("Event: ", event);
    console.log("Context: ", context);

    if (
        !process.env.PRODUCT_TABLE_NAME ||
        !process.env.STOCK_TABLE_NAME ||
        !process.env.PRODUCT_CREATED_SNS_TOPIC_ARN
    ) {
        throw new Error(ENV_MISSING_ERROR);
    }

    try {
        const createdProducts: (ProductCreateDto & {
            id: string,
        }) [] = [];

        for (const record of event.Records) {
            const entry: unknown = JSON.parse(record.body);

            const csvProductDtoParseResult = productCreateCsvDtoSchema.safeParse(entry);

            if (!csvProductDtoParseResult.success) {
                console.error("Faulty entry: ", entry, csvProductDtoParseResult.error);
                continue;
            }

            const productCreateDto = {
                ...csvProductDtoParseResult.data,
                price: Number(csvProductDtoParseResult.data.price),
                count: Number(csvProductDtoParseResult.data.count),
            }

            const productDtoParseResult = productCreateDtoSchema.safeParse(productCreateDto);

            if (!productDtoParseResult.success) {
                console.error("Faulty product: ", productCreateDto, productDtoParseResult.error)
                continue;
            }

            const productDto = productDtoParseResult.data;

            const id = uuid();

            const product = {
                id,
                title: productDto.title,
                description: productDto.description,
                price: productDto.price,
            }

            const stock = {
                product_id: id,
                count: productDto.count,
            }

            await dynamoDBDocClient.transactWrite({
                TransactItems: [
                    {
                        Put: {
                            TableName: process.env.PRODUCT_TABLE_NAME,
                            Item: product,
                        },
                    },
                    {
                        Put: {
                            TableName: process.env.STOCK_TABLE_NAME,
                            Item: stock,
                        },
                    },
                ],
            });

            const createdProduct = {...productDto, id};

            createdProducts.push(createdProduct);

            console.log("Created product: ", createdProduct);
        }

        if (
            createdProducts.length > 0
        ) {
            await snsClient.publish({
                TopicArn: process.env.PRODUCT_CREATED_SNS_TOPIC_ARN,
                Message: JSON.stringify(createdProducts, null, 2),
                Subject: `A batch of new products has been created`,
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
};