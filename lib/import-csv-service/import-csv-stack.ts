import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ImportCsvService} from "./import-csv-service";

export class ImportCsvStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        new ImportCsvService(this, 'import-csv-stack');
    }
}