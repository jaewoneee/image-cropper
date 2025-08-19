"use client";

interface CroppedResultProps {
  croppedImage: string;
  croppedAreaPixels: CroppedAreaPixels | null;
  aspect: number;
  rotation: number;
  onClear: () => void;
}

const CroppedResult: React.FC<CroppedResultProps> = ({
  croppedImage,
  croppedAreaPixels,
  aspect,
  rotation,
  onClear,
}) => {
  const getAspectLabel = (aspectValue: number): string => {
    if (aspectValue === 1) return "1:1";
    if (aspectValue === 4 / 5) return "4:5";
    if (aspectValue === 1.91) return "1.91:1";
    return aspectValue.toFixed(2);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">크롭 결과</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1">
            <img
              src={croppedImage}
              alt="Cropped result"
              className="max-w-full h-auto rounded-lg shadow-md border"
            />
          </div>
          <div className="lg:w-64 space-y-2">
            <h3 className="font-semibold text-gray-800">이미지 정보</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>비율: {getAspectLabel(aspect)}</div>
              <div>회전: {rotation}°</div>
              {croppedAreaPixels && (
                <div>
                  크기: {croppedAreaPixels.width} × {croppedAreaPixels.height}px
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              <a
                href={croppedImage}
                download="cropped-image.jpg"
                className="w-full bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition duration-200 text-sm text-center block"
              >
                이미지 다운로드
              </a>
              <button
                onClick={onClear}
                className="w-full bg-red-100 text-red-700 py-2 px-3 rounded-md hover:bg-red-200 transition duration-200 text-sm"
              >
                결과 지우기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CroppedResult;
