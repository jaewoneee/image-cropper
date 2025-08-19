"use client";
import React, { useState, useCallback, ChangeEvent, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  createCroppedImage,
  createSimpleCroppedImage,
  getClosestAspectRatio,
} from "@/lib/utils";
import { toast } from "sonner";

interface CropDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  image: ImageItem | null;
  onCropComplete: (
    imageId: string,
    croppedImageUrl: string,
    finalAspectRatio: number
  ) => void;
}

const CropDialog: React.FC<CropDialogProps> = ({
  isOpen,
  onOpenChange,
  image,
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

  // Dialog가 열릴 때 권장 비율로 초기화
  useEffect(() => {
    if (isOpen && image) {
      setIsDialogReady(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);

      // 현재 이미지 비율에 가장 가까운 권장 비율로 설정
      const recommendedAspect = getClosestAspectRatio(image.aspectRatio);
      setAspect(recommendedAspect);

      const timer = setTimeout(() => {
        setIsDialogReady(true);
        setCropperKey((prev) => prev + 1);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsDialogReady(false);
    }
  }, [isOpen, image]);

  const onCropCompleteHandler = useCallback(
    (croppedArea: CropArea, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropApply = useCallback(async (): Promise<void> => {
    if (!croppedAreaPixels || !image) {
      alert("크롭 영역이 설정되지 않았습니다.");
      return;
    }

    try {
      const croppedImageUrl =
        rotation === 0
          ? await createSimpleCroppedImage(image.src, croppedAreaPixels)
          : await createCroppedImage(image.src, croppedAreaPixels, rotation);

      onCropComplete(image.id, croppedImageUrl, aspect);
      onOpenChange(false);
      toast.success("이미지 크롭이 완료되었습니다!");
    } catch (error) {
      console.error("크롭 처리 중 오류:", error);
      try {
        const croppedImageUrl = await createSimpleCroppedImage(
          image.src,
          croppedAreaPixels
        );
        onCropComplete(image.id, croppedImageUrl, aspect);
        onOpenChange(false);
        toast.success("이미지 크롭이 완료되었습니다!");
      } catch (fallbackError) {
        toast.error(`크롭 처리 중 오류가 발생했습니다: ${error}`);
      }
    }
  }, [
    croppedAreaPixels,
    image,
    rotation,
    aspect,
    onCropComplete,
    onOpenChange,
  ]);

  const handleReset = (): void => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCropperKey((prev) => prev + 1);
  };

  const getAspectLabel = (aspectValue: number): string => {
    if (aspectValue === 1) return "1:1";
    if (aspectValue === 4 / 5) return "4:5";
    if (aspectValue === 1.91) return "1.91:1";
    return aspectValue.toFixed(2);
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[1000px] max-h-[90vh] overflow-y-scroll [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
      >
        <DialogTitle className="mt-4">{image.name} - 이미지 크롭</DialogTitle>
        <p className="text-xs text-gray-500 mt-1">
          현재 비율: {image.aspectRatio.toFixed(2)} → 권장 비율로 크롭해주세요
        </p>
        <div className="flex flex-col gap-6">
          {/* Crop Area */}
          <div className="lg:col-span-2">
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {image.src && isDialogReady && (
                <Cropper
                  key={cropperKey}
                  image={image.src}
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
              {image.src && !isDialogReady && (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-gray-500">이미지 로딩 중...</div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Recommended Aspect Ratio */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                ✅ 권장 비율
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
                    <span className="text-sm text-blue-700 font-medium">
                      {ratio.label}
                    </span>
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
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-medium text-sm"
              >
                크롭 완료
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200 font-medium text-sm"
              >
                초기화
              </button>
            </div>

            {/* Current Values Display */}
            <div className="bg-blue-50 p-3 rounded-lg text-xs">
              <h4 className="font-semibold text-blue-800 mb-2">현재 설정</h4>
              <div className="space-y-1 text-blue-700">
                <div>타겟 비율: {getAspectLabel(aspect)}</div>
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
