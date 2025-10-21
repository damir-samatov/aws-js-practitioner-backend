import {S3Handler} from "aws-lambda";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import {Readable} from "node:stream";
import csv from "csv-parser";

const client = new S3Client({region: process.env.AWS_REGION});

export const parseCsv: S3Handler = async (event, context) => {
    console.log({event, context});

    if (!process.env.UPLOADED_BUCKET_FOLDER || !process.env.PARSED_BUCKET_FOLDER) {
        throw new Error("Environment variables for prefixes are not set");
    }

    const bucketName = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    const command = new GetObjectCommand({Bucket: bucketName, Key: key});
    const response = await client.send(command);
    const stream = response.Body as Readable;

    await new Promise<void>((resolve, reject) => {
        stream
            .pipe(csv())
            .on("data", (data) => console.log("Parsed record:", data))
            .on("end", () => {
                console.log("Finished parsing file:", key);
                resolve();
            })
            .on("error", (err) => {
                console.error("Error parsing CSV:", err);
                reject(err);
            });
    });

    const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: key.replace(process.env.UPLOADED_BUCKET_FOLDER, process.env.PARSED_BUCKET_FOLDER),
    });
    await client.send(copyCommand);

    const deleteCommand = new DeleteObjectCommand({Bucket: bucketName, Key: key});
    await client.send(deleteCommand);

    console.log("File moved to parsed folder and original deleted:", key);
};