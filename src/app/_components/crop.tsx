"use client";
import React, { useState, useCallback, ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import CropDialog from "./crop-dialog";
import CroppedResult from "./crop-result";

const MAX_PIXEL = 4000;
const ImageCropComponent: React.FC = () => {
  const imageRef = useRef<HTMLInputElement | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("/api/placeholder/400/300");
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [aspect, setAspect] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // 이미지 리사이징 함수
  const resizeImage = useCallback(
    (file: File, maxWidth = 3000): Promise<string> => {
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
    },
    []
  );

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
      if (croppedImage && croppedImage.startsWith("blob:")) {
        URL.revokeObjectURL(croppedImage);
      }

      const resizedImageUrl = await resizeImage(file);
      setImageSrc(resizedImageUrl);
      setCroppedImage(null);
      setCroppedAreaPixels(null);

      setTimeout(() => {
        setIsCropperOpen(true);
      }, 50);
    } catch (error) {
      console.error("이미지 처리 중 오류:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl);
  }, []);

  const handleClearResult = useCallback(() => {
    if (croppedImage && croppedImage.startsWith("blob:")) {
      URL.revokeObjectURL(croppedImage);
    }
    (imageRef?.current as HTMLInputElement).value = "";
    setCroppedImage(null);
  }, [croppedImage]);

  return (
    <div className="max-w-4xl mx-auto p-6  min-h-screen">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이미지 업로드
        </label>
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <CropDialog
        isOpen={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        imageSrc={imageSrc}
        onCropComplete={handleCropComplete}
      />

      {croppedImage && (
        <CroppedResult
          croppedImage={croppedImage}
          croppedAreaPixels={croppedAreaPixels}
          aspect={aspect}
          rotation={rotation}
          onClear={handleClearResult}
        />
      )}
    </div>
  );
};

export default ImageCropComponent;
