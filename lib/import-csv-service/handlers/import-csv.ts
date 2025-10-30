import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from "aws-lambda";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {createResponse} from "../../../shared/utils";
import {ENV_MISSING_ERROR, INTERNAL_SERVER_ERROR} from "../../../shared/constants";

const client = new S3Client({region: process.env.AWS_REGION});

export const importCsv: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
    event,
    context
) => {
    console.log("Event: ", event);
    console.log("Context: ", context);

    if (!process.env.UPLOADED_BUCKET_FOLDER) {
        throw new Error(ENV_MISSING_ERROR);
    }

    try {
        if (!event.queryStringParameters?.name) {
            return createResponse(400, {data: {message: "name query parameter is required"}});
        }

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: process.env.UPLOADED_BUCKET_FOLDER + event.queryStringParameters.name,
            ContentType: "text/csv",
        });
        const url = await getSignedUrl(client, command, {
            expiresIn: 120,
        });

        return createResponse(200, {message: "Success", url});
    } catch (error) {
        console.error("Error:", error);

        return createResponse(500, {message: INTERNAL_SERVER_ERROR});
    }
};