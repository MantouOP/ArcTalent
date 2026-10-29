import { maxStoredPhotoLength, validatePhotoFile } from './profile-pictures';

export class PhotoUploadError extends Error {
  constructor(public code: 'type' | 'size' | 'dimensions' | 'decode') {
    super(code);
  }
}
/** Decode and centre-crop on the device; only the small re-encoded image is saved. */
export async function prepareProfilePhoto(file: File): Promise<string> {
  const invalid = validatePhotoFile(file);
  if (invalid) throw new PhotoUploadError(invalid);
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    if (
      bitmap.width < 1 ||
      bitmap.height < 1 ||
      bitmap.width * bitmap.height > 24000000
    )
      throw new PhotoUploadError('dimensions');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new PhotoUploadError('decode');
    const side = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = '#100e26';
    context.fillRect(0, 0, 256, 256);
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      256,
      256,
    );
    const dataUrl = canvas.toDataURL('image/webp', 0.84);
    if (dataUrl.length > maxStoredPhotoLength)
      throw new PhotoUploadError('size');
    return dataUrl;
  } catch (error) {
    throw error instanceof PhotoUploadError
      ? error
      : new PhotoUploadError('decode');
  } finally {
    bitmap?.close();
  }
}
