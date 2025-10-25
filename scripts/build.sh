#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Building the NestJS application..."
npm run build

echo "Build complete. Output is in the /dist folder."


