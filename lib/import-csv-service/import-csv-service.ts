import {
    FRONTEND_URL,
    UPLOADED_BUCKET_FOLDER,
    PARSED_BUCKET_FOLDER,
} from "../../shared/constants";

import {Construct} from "constructs";

import {
    aws_apigateway,
    aws_lambda,
    aws_s3,
    Duration,
    RemovalPolicy,
    aws_s3_notifications, aws_sqs,
} from "aws-cdk-lib";
import path from "path";
import {HttpMethods} from "aws-cdk-lib/aws-s3";

const DEFAULT_LAMBDA_CONFIG = {
    runtime: aws_lambda.Runtime.NODEJS_20_X,
    memorySize: 1024,
    timeout: Duration.seconds(5),
    code: aws_lambda.Code.fromAsset(path.join(__dirname, '../../dist/lib/import-csv-service/handlers')),
}

type ImportCsvServiceProps = {
    createBatchProductsSqs: aws_sqs.Queue;
}

export class ImportCsvService extends Construct {
    constructor(scope: Construct, id: string, props: ImportCsvServiceProps) {
        super(scope, id);

        const s3Bucket = new aws_s3.Bucket(this, "import-csv-bucket", {
            bucketName: "import-csv-bucket-damir",
            removalPolicy: RemovalPolicy.DESTROY,
            cors: [
                {
                    allowedOrigins: [FRONTEND_URL],
                    allowedMethods: [HttpMethods.PUT],
                    allowedHeaders: ["*"],
                },
            ],
        });

        const importCsvLambda = new aws_lambda.Function(this, "import-csv-lambda", {
            ...DEFAULT_LAMBDA_CONFIG,
            handler: "import-csv.importCsv",
            environment: {
                BUCKET_NAME: s3Bucket.bucketName,
                UPLOADED_BUCKET_FOLDER,
            },
        });

        s3Bucket.grantPut(importCsvLambda);

        const parseCsvLambda = new aws_lambda.Function(this, "parse-csv-lambda", {
            ...DEFAULT_LAMBDA_CONFIG,
            handler: "parse-csv.parseCsv",
            environment: {
                UPLOADED_BUCKET_FOLDER,
                PARSED_BUCKET_FOLDER,
                CREATE_BATCH_PRODUCTS_SQS_URL: props.createBatchProductsSqs.queueUrl,
            },
        });

        props.createBatchProductsSqs.grantSendMessages(parseCsvLambda);

        s3Bucket.grantReadWrite(parseCsvLambda);

        s3Bucket.addEventNotification(
            aws_s3.EventType.OBJECT_CREATED,
            new aws_s3_notifications.LambdaDestination(parseCsvLambda),
            {prefix: UPLOADED_BUCKET_FOLDER}
        );

        const api = new aws_apigateway.RestApi(this, "import-csv-service-api", {
            restApiName: "Import API",
            description: "APIs for import",
            defaultCorsPreflightOptions: {
                allowOrigins: [FRONTEND_URL],
                allowMethods: ["GET", "POST", "OPTIONS"],
                allowHeaders: ["Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"],
            },
        });

        const importResource = api.root.addResource("import");
        const productsLambdaIntegration = new aws_apigateway.LambdaIntegration(importCsvLambda);
        importResource.addMethod("GET", productsLambdaIntegration);
    }
}