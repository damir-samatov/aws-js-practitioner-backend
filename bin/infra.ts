import {App} from 'aws-cdk-lib';
import {ProductStack} from "../lib/product-service/product-stack";
import {ImportCsvStack} from "../lib/import-csv-service/import-csv-stack";

const app = new App();
new ProductStack(app, 'product-stack');
new ImportCsvStack(app, 'import-csv-stack');