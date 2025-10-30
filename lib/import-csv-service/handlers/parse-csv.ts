import {S3Handler} from "aws-lambda";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import {Readable} from "node:stream";
import csv from "csv-parser";
import {SQSClient, SendMessageCommand} from "@aws-sdk/client-sqs";
import {ENV_MISSING_ERROR} from "../../../shared/constants";

const s3Client = new S3Client({region: process.env.AWS_REGION});
const sqsClient = new SQSClient({region: process.env.AWS_REGION});

const sendEntryToSQSClient = async (entry: unknown) => {
    const sqsSendCommand = new SendMessageCommand({
        QueueUrl: process.env.CREATE_BATCH_PRODUCTS_SQS_URL,
        MessageBody: JSON.stringify(entry),
    });

    return await sqsClient.send(sqsSendCommand);
}

export const parseCsv: S3Handler = async (event, context) => {
    console.log("Event: ", event);
    console.log("Context: ", context);

    if (!process.env.UPLOADED_BUCKET_FOLDER || !process.env.PARSED_BUCKET_FOLDER || !process.env.CREATE_BATCH_PRODUCTS_SQS_URL) {
        throw new Error(ENV_MISSING_ERROR);
    }

    try {
        const bucketName = event.Records[0].s3.bucket.name;
        const key = event.Records[0].s3.object.key;

        const s3GetCommand = new GetObjectCommand({Bucket: bucketName, Key: key});
        const response = await s3Client.send(s3GetCommand);

        const stream = response.Body as Readable;

        const entries: unknown[] = [];

        await new Promise<void>((resolve, reject) => {
            stream.pipe(csv())
                .on("data", (data) => {
                    console.log("Entry: ", data)
                    entries.push(data);
                })
                .on("end", async () => {
                    await Promise.all(
                        entries.map(sendEntryToSQSClient)
                    );
                    resolve();
                })
                .on("error", (error) => {
                    console.error("Error parsing CSV: ", error);
                    reject(error);
                });
        });

        const s3CopyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${key}`,
            Key: key.replace(process.env.UPLOADED_BUCKET_FOLDER, process.env.PARSED_BUCKET_FOLDER),
        });

        await s3Client.send(s3CopyCommand);

        const s3DeleteCommand = new DeleteObjectCommand({Bucket: bucketName, Key: key});

        await s3Client.send(s3DeleteCommand);
    } catch (error) {
        console.error("Error:", error);
    }
};