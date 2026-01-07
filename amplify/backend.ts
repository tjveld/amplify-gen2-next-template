
import { defineBackend } from "@aws-amplify/backend";
import { Stack, Duration } from "aws-cdk-lib";
import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  RestApi,
  RequestAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

import { restApiFunction } from "./functions/api/resource";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";


import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { onUpload } from "./functions/on-upload/resource";
import { contentBucket, uploadBucket } from "./storage/resource";

const backend = defineBackend({
  auth,
  data,
  contentBucket,
  uploadBucket,
  restApiFunction,
});


const bucket = backend.uploadBucket.resources.bucket;
const storageStack = Stack.of(bucket);
const onUploadLambda = new NodejsFunction(storageStack, "OnUploadFn", {
  entry: "amplify/functions/on-upload/handler.ts", // your handler file
  runtime: lambda.Runtime.NODEJS_18_X,
});
// Permissions: allow the function to read uploaded objects
bucket.grantReadWrite(onUploadLambda);
// Subscribe Lambda to OBJECT_CREATED events
bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(onUploadLambda)
);


// Create a new API stack
const apiStack = backend.createStack("api-stack");

// Create REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "LocalBooks",
  deploy: true,
  deployOptions: { stageName: "prd" },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // tighten for production
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

// Lambda integration for your API handler
const lambdaIntegration = new LambdaIntegration(
  backend.restApiFunction.resources.lambda
);

const requestAuthorizerFn = new NodejsFunction(apiStack, "BooksQueryKeyAuthorizerFn", {
  entry: "amplify/functions/scanner-authorizer/handler.ts", // path to your handler file
  runtime: lambda.Runtime.NODEJS_18_X,
});

// Request-based Lambda Authorizer (querystring-only)
const requestAuthorizer = new RequestAuthorizer(apiStack, "scannerRequestAuthorizer", {
  handler: requestAuthorizerFn,
  identitySources: ["method.request.querystring.key"], // ONLY querystring `key`
  resultsCacheTtl: Duration.seconds(0), // optional: disable caching
});

// Resource path: /book
const booksPath = myRestApi.root.addResource("book");

// Secure methods with CUSTOM authorizer
["GET", "POST", "PUT", "DELETE"].forEach((method) => {
  booksPath.addMethod(method, lambdaIntegration, {
    authorizationType: AuthorizationType.CUSTOM,
    authorizer: requestAuthorizer,
  });
});

// Optional: proxy under /books
booksPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
  defaultMethodOptions: {
    authorizationType: AuthorizationType.CUSTOM,
    authorizer: requestAuthorizer,
  },
});

// Outputs for frontend config
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});