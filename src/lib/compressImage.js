import imageCompression from 'browser-image-compression';
import { HOUSING_PHOTOS, AVATAR_COMPRESS } from './constants';

/**
 * Стискає зображення перед завантаженням у Storage.
 * Повертає File; при помилці — оригінальний file.
 */
export async function compressHousingImage(file) {
  if (!file?.type?.startsWith('image/')) return file;
  try {
    const opts = {
      maxSizeMB: HOUSING_PHOTOS.compressMaxSizeMB,
      maxWidthOrHeight: HOUSING_PHOTOS.compressMaxWidthOrHeight,
      useWebWorker: true,
      preserveExif: false,
    };
    const compressed = await imageCompression(file, opts);
    return new File([compressed], file.name, { type: compressed.type });
  } catch (e) {
    console.warn('[compressHousingImage]', e);
    return file;
  }
}

/**
 * Стискає аватар перед завантаженням (макс. 512px, ~0.5 MB).
 * Повертає File; при помилці — оригінальний file.
 */
export async function compressAvatarImage(file) {
  if (!file?.type?.startsWith('image/')) return file;
  try {
    const opts = {
      maxSizeMB: AVATAR_COMPRESS.maxSizeMB,
      maxWidthOrHeight: AVATAR_COMPRESS.maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: false,
    };
    const compressed = await imageCompression(file, opts);
    return new File([compressed], file.name, { type: compressed.type });
  } catch (e) {
    console.warn('[compressAvatarImage]', e);
    return file;
  }
}
