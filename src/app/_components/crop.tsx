"use client";
import { toast } from "sonner";
import React, { useState, useCallback, ChangeEvent, useEffect } from "react";
import CropDialog from "./crop-dialog";
import ImageSummary from "./image-summary";
import ImageThumbnail from "./image-thumbnail";
import {
  calculateAspectRatio,
  isValidAspectRatio,
  resizeImage,
} from "@/lib/utils";

const ImageCropComponent: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState<ImageItem | null>(
    null
  );

  // 이미지 메타데이터 추출 함수
  const extractImageMetadata = useCallback(
    (
      file: File
    ): Promise<{ aspectRatio: number; width: number; height: number }> => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const aspectRatio = calculateAspectRatio(image.width, image.height);
          resolve({
            aspectRatio,
            width: image.width,
            height: image.height,
          });
        };
        image.src = URL.createObjectURL(file);
      });
    },
    []
  );

  // 다중 파일 업로드 처리
  const handleFilesUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const newImages: ImageItem[] = [];

      for (const file of files) {
        // 이미지 메타데이터 추출
        const metadata = await extractImageMetadata(file);

        // 이미지 리사이징 (필요시)
        const resizedImageUrl = await resizeImage(file);

        const imageItem: ImageItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          originalFile: file,
          src: resizedImageUrl,
          name: file.name,
          size: file.size,
          aspectRatio: metadata.aspectRatio,
          isValidAspect: isValidAspectRatio(metadata.aspectRatio),
          needsCrop: !isValidAspectRatio(metadata.aspectRatio),
        };

        newImages.push(imageItem);
      }

      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${files.length}개의 이미지가 업로드되었습니다.`);

      // 부적합한 비율의 이미지 개수 알림
      const invalidCount = newImages.filter((img) => !img.isValidAspect).length;
      if (invalidCount > 0) {
        toast.warning(`${invalidCount}개의 이미지가 크롭이 필요합니다.`);
      }
    } catch (error) {
      console.error("이미지 처리 중 오류:", error);
      toast.error("이미지 처리 중 오류가 발생했습니다.");
    }

    // 파일 입력 초기화
    event.target.value = "";
  };

  // 개별 이미지 크롭 시작
  const handleCropImage = useCallback((image: ImageItem) => {
    setCurrentCropImage(image);
    setIsCropperOpen(true);
  }, []);

  // 크롭 완료 처리
  const handleCropComplete = useCallback(
    (imageId: string, croppedImageUrl: string, finalAspectRatio: number) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                croppedSrc: croppedImageUrl,
                aspectRatio: finalAspectRatio,
                isValidAspect: true,
                needsCrop: false,
              }
            : img
        )
      );
    },
    []
  );

  // 이미지 삭제
  const handleDeleteImage = useCallback((imageId: string) => {
    setImages((prev) => {
      const imageToDelete = prev.find((img) => img.id === imageId);
      if (imageToDelete) {
        // blob URL 정리
        if (imageToDelete.src.startsWith("blob:")) {
          URL.revokeObjectURL(imageToDelete.src);
        }
        if (
          imageToDelete.croppedSrc &&
          imageToDelete.croppedSrc.startsWith("blob:")
        ) {
          URL.revokeObjectURL(imageToDelete.croppedSrc);
        }
      }
      return prev.filter((img) => img.id !== imageId);
    });
  }, []);

  // 모든 완성된 이미지 다운로드
  const handleDownloadAll = useCallback(() => {
    const completedImages = images.filter((img) => img.croppedSrc);

    completedImages.forEach((image, index) => {
      const link = document.createElement("a");
      link.href = image.croppedSrc!;
      link.download = `cropped-${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast.success(`${completedImages.length}개의 이미지를 다운로드했습니다.`);
  }, [images]);

  // 컴포넌트 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.src.startsWith("blob:")) {
          URL.revokeObjectURL(image.src);
        }
        if (image.croppedSrc && image.croppedSrc.startsWith("blob:")) {
          URL.revokeObjectURL(image.croppedSrc);
        }
      });
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          다중 이미지 크롭 도구
        </h1>
        <p className="text-gray-600">
          여러 이미지를 업로드하고 권장 비율(1:1, 4:5, 1.91:1)에 맞게
          크롭하세요.
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">📁</div>
            <div>
              <label className="cursor-pointer">
                <span className="text-lg font-medium text-blue-600 hover:text-blue-700">
                  이미지 파일 선택
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesUpload}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                여러 이미지를 동시에 선택할 수 있습니다. (JPG, PNG, GIF 등)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <ImageSummary images={images} onDownloadAll={handleDownloadAll} />

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            업로드된 이미지 ({images.length}개)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((image) => (
              <ImageThumbnail
                key={image.id}
                image={image}
                onCrop={handleCropImage}
                onDelete={handleDeleteImage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">🖼️</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            아직 업로드된 이미지가 없습니다
          </h3>
          <p className="text-gray-500">
            위의 파일 선택 버튼을 클릭하여 이미지를 업로드해보세요.
          </p>
        </div>
      )}

      {/* Crop Dialog */}
      <CropDialog
        isOpen={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        image={currentCropImage}
        onCropComplete={handleCropComplete}
      />

      {/* Instructions */}
      {images.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 사용 방법</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ⚠️ 경고 표시가 있는 이미지는 크롭이 필요합니다</li>
            <li>{`• "크롭하기" 버튼을 클릭하여 권장 비율에 맞게 조정하세요`}</li>
            <li>• ✓ 완료 표시가 있는 이미지는 크롭이 완료된 상태입니다</li>
            <li>• 모든 이미지 크롭이 완료되면 일괄 다운로드할 수 있습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageCropComponent;
