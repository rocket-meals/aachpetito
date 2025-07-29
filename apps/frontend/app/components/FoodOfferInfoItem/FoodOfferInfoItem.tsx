import React, {memo, useEffect, useState} from 'react';
import {Text, Linking, Dimensions} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FoodOfferInfoItemProps } from './types';
import styles from './styles';
import CardWithText from '../CardWithText/CardWithText';
import { getImageUrl } from '@/constants/HelperFunctions';
import { isWeb } from '@/constants/Constants';
import CardDimensionHelper from "@/helper/CardDimensionHelper";
import {useSelector} from "react-redux";
import {RootState} from "@/redux/reducer";
import {CommonSystemActionHelper} from "@/helper/SystemActionHelper";

const FoodOfferInfoItem: React.FC<FoodOfferInfoItemProps> = memo(({ item, content }) => {
  const { theme } = useTheme();
  const {
    amountColumnsForcard,
    language,
    serverInfo,
    appSettings,
    primaryColor,
  } = useSelector((state: RootState) => state.settings);

  const [screenWidth, setScreenWidth] = useState(
      Dimensions.get('window').width
  );

  useEffect(() => {
    CardDimensionHelper.getCardWidth(screenWidth, amountColumnsForcard);
  }, [amountColumnsForcard, screenWidth]);

  const imageId = typeof item.image === 'string' ? item.image : item.image?.id;
  const imageUri = item.image_remote_url || (imageId ? getImageUrl(imageId) : undefined);

  const openInBrowser = async (url: string) => {
    CommonSystemActionHelper.openExternalURL(url, true);
  };

  const handlePress = () => {
    if (item.link) {
      openInBrowser(item.link);
    }
  };

  return (
    <CardWithText
      onPress={item.link ? handlePress : undefined}
      imageSource={imageUri ? { uri: imageUri } : undefined}
      containerStyle={{
        width:
            amountColumnsForcard === 0
                ? CardDimensionHelper.getCardDimension(screenWidth)
                : CardDimensionHelper.getCardWidth(
                    screenWidth,
                    amountColumnsForcard
                ),
        backgroundColor: theme.card.background,
        borderWidth: 0,
        borderColor: '#FF000095',
      }}
      imageContainerStyle={{
        height:
            amountColumnsForcard === 0
                ? CardDimensionHelper.getCardDimension(screenWidth)
                : CardDimensionHelper.getCardWidth(
                    screenWidth,
                    amountColumnsForcard
                ),
      }}
      contentStyle={{
        gap: isWeb ? 15 : 5,
        paddingHorizontal: isWeb
            ? screenWidth > 550
                ? 5
                : screenWidth > 360
                    ? 5
                    : 5
            : 5,
      }}
    >
      <Text style={[styles.text, { color: theme.screen.text }]}>{content}</Text>
    </CardWithText>
  );
});

export default FoodOfferInfoItem;
