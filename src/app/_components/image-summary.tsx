interface ImageSummaryProps {
  images: ImageItem[];
  onDownloadAll: () => void;
}

const ImageSummary: React.FC<ImageSummaryProps> = ({
  images,
  onDownloadAll,
}) => {
  const totalImages = images.length;
  const croppedImages = images.filter((img) => img.croppedSrc).length;
  const pendingImages = images.filter(
    (img) => !img.isValidAspect && !img.croppedSrc
  ).length;

  const isAllComplete = pendingImages === 0 && totalImages > 0;

  if (totalImages === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-800">이미지 처리 현황</h3>
          <div className="text-sm text-gray-600">
            전체 {totalImages}개 중 {croppedImages}개 완료, {pendingImages}개
            대기
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>완료: {croppedImages}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>크롭 필요: {pendingImages}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          {isAllComplete ? (
            <button
              onClick={onDownloadAll}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
            >
              모든 이미지 다운로드
            </button>
          ) : (
            <div className="text-sm text-orange-600 font-medium">
              {pendingImages}개 이미지의
              <br />
              크롭이 필요합니다
            </div>
          )}
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>진행률</span>
          <span>{Math.round((croppedImages / totalImages) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isAllComplete ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${(croppedImages / totalImages) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ImageSummary;
