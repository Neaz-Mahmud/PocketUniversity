const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const r2Client = require('../config/r2');

const BUCKET = process.env.R2_BUCKET_NAME;

/**
 * Generate a presigned PUT URL for uploading a file directly to R2.
 */
const generatePresignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Generate a presigned GET URL for downloading a file from R2.
 */
const generatePresignedDownloadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Delete an object from R2.
 */
const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return r2Client.send(command);
};

module.exports = { generatePresignedUploadUrl, generatePresignedDownloadUrl, deleteObject };
