import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export async function uploadImage(
  file: string | Buffer,
  options?: {
    folder?: string;
    transformation?: object;
    publicId?: string;
  }
): Promise<UploadResult> {
  const uploadOptions = {
    folder: options?.folder || 'jo-cars',
    transformation: options?.transformation || [
      { quality: 'auto', fetch_format: 'auto' },
    ],
    public_id: options?.publicId,
  };

  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    uploadOptions
  );

  return {
    url: result.url,
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export async function uploadMultipleImages(
  files: (string | Buffer)[],
  folder?: string
): Promise<UploadResult[]> {
  const uploads = files.map((file) => uploadImage(file, { folder }));
  return Promise.all(uploads);
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}

export async function generateVideoThumbnail(videoPublicId: string): Promise<string> {
  const result = await cloudinary.api.resource(videoPublicId, {
    resource_type: 'video',
  });
  return result.secure_url.replace('.mp4', '.jpg');
}

export function getOptimizedUrl(publicId: string, options?: { width?: number; height?: number; quality?: string }) {
  return cloudinary.url(publicId, {
    transformation: [
      { width: options?.width || 800, height: options?.height || 600, crop: 'fill', quality: options?.quality || 'auto' },
    ],
  });
}

export { cloudinary };
