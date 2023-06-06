#!/bin/bash

set -euo pipefail

echo "🛠   building ..."
npm run build

echo "📦   exporting ..."
npm run export

echo "⤴️   uploading to s3 ..."
aws s3 cp out s3://platform.glass/ --recursive
echo "✅  uploaded"

cd out
echo "🗜   renaming files, setting metadata ..."
# https://stackoverflow.com/questions/23463679/s3-static-pages-without-html-extension
for file in *.html; do
    aws s3 mv \
      --content-type 'text/html' \
      --metadata-directive REPLACE \
      "s3://platform.glass/$file" "s3://platform.glass/${file%%.html}"
done
echo "✅  done"

aws cloudfront create-invalidation --distribution-id E47A8YNWZ3IAG --paths "/*"
