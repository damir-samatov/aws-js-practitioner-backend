import {aws_lambda, aws_sqs, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ImportCsvService} from "./import-csv-service";

type ImportCsvStackProps = StackProps & {
    createBatchProductsSqs: aws_sqs.Queue;
    basicAuthorizerLambda: aws_lambda.Function;
};

export class ImportCsvStack extends Stack {
    constructor(scope: Construct, id: string, props: ImportCsvStackProps) {
        super(scope, id, props);

        new ImportCsvService(this, 'import-csv-stack', {
            createBatchProductsSqs: props.createBatchProductsSqs,
            basicAuthorizerLambda: props.basicAuthorizerLambda
        });
    }
}