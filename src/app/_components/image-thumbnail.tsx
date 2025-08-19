"use client";
import { ASPECT_TOLERANCE } from "@/lib/constants";

interface ImageThumbnailProps {
  image: ImageItem;
  onCrop: (image: ImageItem) => void;
  onDelete: (imageId: string) => void;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  image,
  onCrop,
  onDelete,
}) => {
  const getAspectRatioLabel = (ratio: number): string => {
    if (Math.abs(ratio - 1) <= ASPECT_TOLERANCE) return "1:1";
    if (Math.abs(ratio - 4 / 5) <= ASPECT_TOLERANCE) return "4:5";
    if (Math.abs(ratio - 1.91) <= ASPECT_TOLERANCE) return "1.91:1";
    return ratio.toFixed(2);
  };
  return (
    <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 경고 배지 */}
      {!image.isValidAspect && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
            ⚠️ 크롭 필요
          </div>
        </div>
      )}

      {/* 완료 배지 */}
      {image.croppedSrc && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
            ✓ 완료
          </div>
        </div>
      )}

      {/* 이미지 */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image.croppedSrc || image.src}
          alt={image.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 정보 */}
      <div className="p-3">
        <h4 className="font-medium text-sm text-gray-800 truncate mb-1">
          {image.name}
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>크기: {(image.size / 1024).toFixed(1)}KB</div>
          <div
            className={`font-semibold ${
              !image.isValidAspect ? "text-red-600" : "text-green-600"
            }`}
          >
            비율: {getAspectRatioLabel(image.aspectRatio)}
          </div>
          {!image.isValidAspect && (
            <div className="text-red-600 text-xs">권장: 1:1, 4:5, 1.91:1</div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onCrop(image)}
            className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            {image.isValidAspect ? "재크롭" : "크롭하기"}
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className="px-3 py-1.5 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageThumbnail;
