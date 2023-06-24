#!/bin/bash

set -euo pipefail

npx vsce package

# Find the .vsix file in the current directory
FILE_NAME=$(ls | grep .vsix)

if [ -z "$FILE_NAME" ]
then
    echo "No .vsix file found in the current directory."
    exit 1
fi

# Unzip the vsix file
unzip $FILE_NAME -d vsix_content

# Change directory to the extension folder
cd vsix_content/extension

# Update the package.json file
jq ".dependencies = {\"@dqbd/tiktoken\": \"*\"}" package.json > temp.json && rm -f package.json && mv temp.json package.json
jq ".devDependencies = {}" package.json > temp.json && rm -f package.json && mv temp.json package.json
touch yarn.lock

# Install the dependency
yarn install

# Go back to the parent directory
cd ../..

rm -f .yarn.lock
mv vsix_content/extension/yarn.lock .yarn.lock

rm -f $FILE_NAME

rm -rf vsix_content

echo "Process complete. The updated extension is in $FILE_NAME"
