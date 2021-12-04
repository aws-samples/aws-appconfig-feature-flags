# AWS AppConfig Feature Flags example

## Description
AWS AppConfig Feature Flags provide customers with the control to roll out new features at the rate that they want to introduce the change to their application. Customers can validate these changes to make sure that they are free of errors and match the expected input of their application. While deploying new values gradually, in case there is an error, AWS AppConfig can roll back the changes automatically to prevent any application outages.

To introduce you to AWS AppConfig Feature Flags, we’ll build a sample application that takes advantage of feature flags and show how the new managed experience works.

Read more in the blog post Introducing AWS AppConfig Feature Flags In Preview: https://aws.amazon.com/blogs/mt/introducing-aws-appconfig-feature-flags-in-preview/

## Install the backend application

1. Clone the repo onto your local development machine.
```bash
git clone https://github.com/aws-samples/aws-appconfig-feature-flags.git
```
2. Run the following commands to change to the backend directory and install dependencies.
```bash
cd aws-appconfig-feature-flags
cd backend
npm install
```
3. Process and build your application using the AWS SAM template file.
```bash
sam build
```
4. Deploy the backend application using the following command and follow the prompts. 
```bash
sam deploy --guided
```
5. Add the IDs of the AppConfig Application, Environment, and Configuration Profile when prompted, and confirm all of the deployment prompts.
6. In the output of the deployment, note the DynamoDBTableName key and the HTTPApiUrl key. You will get the output similar to the following:
```bash
Key DynamoDBTableName Description The name of your DynamoDB table Value sam-app-DynamoDBTable-XXXXXXXXXXX
Key HttpApiUrl Description URL of your API endpoint Value https://XXXXXXXX.execute-api.XX-XXXXXXXX-1.amazonaws.com
```

## Populate DynamoDB table with sample data

1. Open the template file dynamodb.json.template and replace YOUR_DYNAMODB_TABLE_NAME with the DynamoDBTableName key from sam deploy output. Save the file as dynamodb.json.
2. Run the following command to populate the DynamoDB table with sample data:
```bash
aws dynamodb batch-write-item --request-items file://dynamodb.json
```
3. You will get the following output:
```bash
{
"UnprocessedItems": {}
}
```

## Install the front-end application

1. Change to the frontend directory and install the dependencies using
```bash
cd frontend
npm install
```
2. Open the template file config.json.template in the folder src and replace YOUR_API_ENDPOINT with the HTTPApiUrl key from sam deploy output. Save the file as config.json.
3. Start the local development server.
```bash
npm start
```
4. Open http://localhost:3000/ in your browser to view the web application.

## Remove the sample application
Delete the CloudFormation stack via CLI:
```bash
aws cloudformation delete-stack --stack-name YOUR-STACK-NAME
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
