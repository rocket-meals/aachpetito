import React from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { CanteenSelectionSheetProps } from './types';
import CanteenSelection from '../CanteenSelection';

const CanteenSelectionSheet: React.FC<CanteenSelectionSheetProps> = ({ closeSheet }) => {
  const { theme } = useTheme();

  return (
    <BottomSheetScrollView
      style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }}
      contentContainerStyle={styles.contentContainer}
    >
      <CanteenSelection closeSheet={closeSheet} />
    </BottomSheetScrollView>
  );
};

export default CanteenSelectionSheet;
