"use client";

interface CroppedResultProps {
  croppedImage: string;
  onClear: () => void;
  openCropper: () => void;
}

const CroppedResult: React.FC<CroppedResultProps> = ({
  croppedImage,
  onClear,
  openCropper,
}) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">크롭 결과</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <button className="flex-1" onClick={openCropper}>
            <img
              src={croppedImage}
              alt="Cropped result"
              className="max-w-full h-auto rounded-lg shadow-md border"
            />
          </button>
          <div className="lg:w-64 space-y-2">
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
