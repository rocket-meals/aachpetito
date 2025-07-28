import { DatabaseTypes } from 'repo-depkit-common';

export interface CanteenSelectionProps {
  closeSheet?: () => void;
}

export interface CanteenProps extends DatabaseTypes.Canteens {
  imageAssetId: string;
  image_url: string;
}
