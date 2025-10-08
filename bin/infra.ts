import {App} from 'aws-cdk-lib';
import {ProductStack} from "../lib/product-service/product-stack";

const app = new App();
new ProductStack(app, 'product-stack');