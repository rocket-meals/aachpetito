import React from 'react';
import { Text } from 'react-native';
import BaseModal from '@/components/BaseModal';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export interface AvailableFromModalProps {
  visible: boolean;
  onClose: () => void;
  availableFrom: string;
}

const AvailableFromModal: React.FC<AvailableFromModalProps> = ({
  visible,
  onClose,
  availableFrom,
}) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const formatted = new Date(availableFrom).toLocaleDateString();

  return (
    <BaseModal isVisible={visible} onClose={onClose} title={translate(TranslationKeys.free_rooms)}>
      <Text style={{ color: theme.modal.text, textAlign: 'center' }}>
        {translate(TranslationKeys.free_from)}: {formatted}
      </Text>
    </BaseModal>
  );
};

export default AvailableFromModal;
export type { AvailableFromModalProps };
