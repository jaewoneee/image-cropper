interface AspectRatio {
  label: string;
  value: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface CroppedAreaPixels {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageItem {
  id: string;
  originalFile: File;
  src: string;
  name: string;
  size: number;
  aspectRatio: number;
  isValidAspect: boolean;
  croppedSrc?: string;
  needsCrop: boolean;
}
