#!/bin/bash

# esbuild must be marked `external` when bundling the extension, so we must install it as a dependency in the final .vsix archive

DEPENDENCY=esbuild
VERSION=^0.17.18

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
jq ".dependencies = {\"$DEPENDENCY\": \"$VERSION\"}" package.json > temp.json && rm -f package.json && mv temp.json package.json

# Install the dependency
npm install --production

# Go back to the root directory
cd ../..

# Compress the updated contents into a .vsix
zip -r updated_extension.zip vsix_content/

rm -f $FILE_NAME

# Rename the .zip to .vsix
mv updated_extension.zip $FILE_NAME

# Remove the temporary folder
rm -rf vsix_content

echo "Process complete. The updated extension is in $FILE_NAME"
