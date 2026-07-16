import imageCompression from "browser-image-compression";

export interface CompressImageOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("The selected file is not an image.");
  }

  const compressedFile = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB ?? 0.8,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1280,
    initialQuality: options.initialQuality ?? 0.9,
    useWebWorker: true,
    fileType: "image/webp",
    preserveExif: false,
  });

  return compressedFile;
}