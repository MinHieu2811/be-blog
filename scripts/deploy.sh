#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Building for production..."
npm run build

echo "Deploying to AWS Lambda..."
serverless deploy --stage prod

echo "Deployment complete!"


