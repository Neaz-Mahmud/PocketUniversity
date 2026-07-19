require('dotenv').config();
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

async function updateCors() {
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const corsParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5000',
            '*'
          ],
          ExposeHeaders: [],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  };

  try {
    console.log(`Updating CORS policy for bucket: ${process.env.R2_BUCKET_NAME}`);
    const command = new PutBucketCorsCommand(corsParams);
    await r2Client.send(command);
    console.log('Successfully updated R2 bucket CORS policy!');
  } catch (error) {
    console.error('Failed to update CORS policy:', error);
  }
}

updateCors();
