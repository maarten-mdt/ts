import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

/**
 * Upload a buffer to Cloudinary. Returns the secure_url.
 * @param {Buffer} buffer
 * @param {object} options - { resource_type: 'raw'|'image', folder?, public_id? }
 */
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resource_type ?? 'image',
        folder: options.folder ?? 'tacticalshack',
        ...options,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    Readable.from(buffer).pipe(stream)
  })
}

export function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
