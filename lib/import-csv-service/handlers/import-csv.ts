import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from "aws-lambda";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {createResponse} from "../../../shared/utils";

const client = new S3Client({region: process.env.AWS_REGION});

export const importCsv: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
    event,
    context
) => {
    console.log({event, context});

    if (!process.env.UPLOADED_BUCKET_FOLDER) {
        throw new Error("Environment variables for prefixes are not set");
    }

    if (!event.queryStringParameters?.name) {
        return createResponse(400, {data: {message: "name query parameter is required"}});
    }

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: process.env.UPLOADED_BUCKET_FOLDER + event.queryStringParameters.name,
            ContentType: "text/csv",
        });
        const url = await getSignedUrl(client, command, {
            expiresIn: 120,
        });

        return createResponse(200, {data: {message: "Success", url}});
    } catch (error) {
        console.error("Error:", error);

        return createResponse(500, {data: {message: "Internal server error"}});
    }
};