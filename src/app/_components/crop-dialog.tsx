"use client";
import React, { useState, useCallback, ChangeEvent, useEffect } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MAX_PIXEL = 4000;

// 1. Dialog Crop Component
interface CropDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

const CropDialog: React.FC<CropDialogProps> = ({
  isOpen,
  onOpenChange,
  imageSrc,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [aspect, setAspect] = useState<number>(1);
  const [cropperKey, setCropperKey] = useState<number>(0);
  const [isDialogReady, setIsDialogReady] = useState<boolean>(false);

  const aspectRatios: AspectRatio[] = [
    { label: "1:1 (Square)", value: 1 },
    { label: "4:5 (Portrait)", value: 4 / 5 },
    { label: "1.91:1 (Landscape)", value: 1.91 },
  ];

  // Dialog가 완전히 열린 후 Cropper 렌더링
  useEffect(() => {
    if (isOpen) {
      setIsDialogReady(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);

      const timer = setTimeout(() => {
        setIsDialogReady(true);
        setCropperKey((prev) => prev + 1);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsDialogReady(false);
    }
  }, [isOpen]);

  const onCropCompleteHandler = useCallback(
    (croppedArea: CropArea, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // 간단한 크롭 함수
  const createSimpleCroppedImage = useCallback(
    (imageSrc: string, pixelCrop: CroppedAreaPixels): Promise<string> => {
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
    },
    []
  );

  // 복잡한 크롭 함수 (회전 포함)
  const createCroppedImage = useCallback(
    async (
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
    },
    []
  );

  const handleCropApply = useCallback(async (): Promise<void> => {
    if (!croppedAreaPixels || !imageSrc) {
      alert("크롭 영역이 설정되지 않았습니다.");
      return;
    }

    try {
      const croppedImageUrl =
        rotation === 0
          ? await createSimpleCroppedImage(imageSrc, croppedAreaPixels)
          : await createCroppedImage(imageSrc, croppedAreaPixels, rotation);

      onCropComplete(croppedImageUrl);
      onOpenChange(false);
    } catch (error) {
      console.error("크롭 처리 중 오류:", error);
      try {
        const croppedImageUrl = await createSimpleCroppedImage(
          imageSrc,
          croppedAreaPixels
        );
        onCropComplete(croppedImageUrl);
        onOpenChange(false);
      } catch (fallbackError) {
        alert(`크롭 처리 중 오류가 발생했습니다: ${error}`);
      }
    }
  }, [
    croppedAreaPixels,
    imageSrc,
    rotation,
    createCroppedImage,
    createSimpleCroppedImage,
    onCropComplete,
    onOpenChange,
  ]);

  const handleReset = (): void => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(1);
    setCroppedAreaPixels(null);
    setCropperKey((prev) => prev + 1);
  };

  const getAspectLabel = (aspectValue: number): string => {
    if (aspectValue === 1) return "1:1";
    if (aspectValue === 4 / 5) return "4:5";
    if (aspectValue === 1.91) return "1.91:1";
    return aspectValue.toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogTitle>Image Crop Tool</DialogTitle>
        <p className="text-xs text-gray-500 mt-1">
          {`* ${MAX_PIXEL}px 이상의 이미지는 자동으로 3000px 이하로 리사이징됩니다.`}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crop Area */}
          <div className="lg:col-span-2">
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {imageSrc && isDialogReady && (
                <Cropper
                  key={cropperKey}
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  rotation={rotation}
                  onCropChange={setCrop}
                  onCropComplete={onCropCompleteHandler}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  showGrid={true}
                  style={{
                    containerStyle: {
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#f3f4f6",
                    },
                    cropAreaStyle: {
                      border: "2px solid #3b82f6",
                    },
                    mediaStyle: {
                      objectFit: "contain",
                    },
                  }}
                />
              )}
              {imageSrc && !isDialogReady && (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-gray-500">이미지 로딩 중...</div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Aspect Ratio Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                비율 선택
              </h3>
              <div className="space-y-2">
                {aspectRatios.map((ratio: AspectRatio) => (
                  <label
                    key={ratio.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="aspect"
                      value={ratio.value}
                      checked={aspect === ratio.value}
                      onChange={(e) => {
                        setAspect(parseFloat(e.target.value));
                        setCrop({ x: 0, y: 0 });
                        setCroppedAreaPixels(null);
                      }}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{ratio.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Zoom Control */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">줌</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>1x</span>
                  <span className="font-semibold">{zoom.toFixed(1)}x</span>
                  <span>3x</span>
                </div>
              </div>
            </div>

            {/* Rotation Control */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">회전</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  value={rotation}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>-180°</span>
                  <span className="font-semibold">{rotation}°</span>
                  <span>180°</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCropApply}
                disabled={!croppedAreaPixels}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-medium"
              >
                크롭 적용
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200 font-medium"
              >
                초기화
              </button>
            </div>

            {/* Current Values Display */}
            <div className="bg-blue-50 p-3 rounded-lg text-xs">
              <h4 className="font-semibold text-blue-800 mb-2">현재 설정</h4>
              <div className="space-y-1 text-blue-700">
                <div>비율: {getAspectLabel(aspect)}</div>
                <div>줌: {zoom.toFixed(1)}x</div>
                <div>회전: {rotation}°</div>
                {croppedAreaPixels && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="font-medium">크롭 영역:</div>
                    <div>
                      크기: {croppedAreaPixels.width}x{croppedAreaPixels.height}
                      px
                    </div>
                    <div>
                      위치: ({croppedAreaPixels.x}, {croppedAreaPixels.y})
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CropDialog;
