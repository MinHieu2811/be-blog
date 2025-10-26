#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

echo "Deploying to region: ${APP_AWS_REGION}..."

# Build the project
echo "Building the project..."
yarn build

# Deploy with Serverless
echo "Deploying with Serverless..."
npx serverless deploy

echo "Deployment finished."


