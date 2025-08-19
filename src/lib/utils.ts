import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import {
  ASPECT_TOLERANCE,
  MAX_PIXEL,
  REQUIRED_ASPECT_RATIOS,
} from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

export const isValidAspectRatio = (aspectRatio: number): boolean => {
  return REQUIRED_ASPECT_RATIOS.some(
    (validRatio) => Math.abs(aspectRatio - validRatio) <= ASPECT_TOLERANCE
  );
};

export const getClosestAspectRatio = (currentRatio: number): number => {
  return REQUIRED_ASPECT_RATIOS.reduce((closest, ratio) => {
    return Math.abs(ratio - currentRatio) < Math.abs(closest - currentRatio)
      ? ratio
      : closest;
  });
};

export const resizeImage = (file: File, maxWidth = 3000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not supported"));
        return;
      }

      const originalWidth = image.width;
      const originalHeight = image.height;
      const needsResize =
        originalWidth > MAX_PIXEL || originalHeight > MAX_PIXEL;

      if (!needsResize) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      let newWidth = originalWidth;
      let newHeight = originalHeight;

      if (originalWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (originalHeight * maxWidth) / originalWidth;
      }

      if (newHeight > maxWidth) {
        newHeight = maxWidth;
        newWidth = (originalWidth * maxWidth) / originalHeight;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            toast.info(
              `Image resized: ${originalWidth}x${originalHeight} → ${Math.round(
                newWidth
              )}x${Math.round(newHeight)}`
            );
            resolve(url);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        image.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  });
};

export const createSimpleCroppedImage = (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not supported"));
        return;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.95
      );
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    image.src = imageSrc;
  });
};

export const createCroppedImage = (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not supported"));
        return;
      }

      const radians = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      const rotatedWidth = image.width * cos + image.height * sin;
      const rotatedHeight = image.width * sin + image.height * cos;

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        reject(new Error("Temp canvas context not supported"));
        return;
      }

      tempCanvas.width = rotatedWidth;
      tempCanvas.height = rotatedHeight;

      tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      tempCtx.rotate(radians);
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        tempCanvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.95
      );
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    image.src = imageSrc;
  });
};
