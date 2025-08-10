import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { LeafletView, LatLng } from 'react-native-leaflet-view';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';

const CENTER: LatLng = { lat: 52.52, lng: 13.405 };

const LeafletViewScreen = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadHtml = async () => {
      const asset = Asset.fromModule(require('@/assets/leaflet.html'));
      await asset.downloadAsync();
      const content = await FileSystem.readAsStringAsync(asset.localUri!);
      if (isMounted) {
        setHtml(content);
      }
    };
    loadHtml();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!html) {
    return <ActivityIndicator />;
  }

  return (
    <LeafletView
      mapCenterPosition={CENTER}
      zoom={13}
      source={{ html }}
      mapMarkers={[
        {
          id: 'remote-icon',
          position: CENTER,
          icon:
            "<img src='https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png' style='width:32px;height:32px;' />",
          size: [32, 32],
        },
      ]}
    />
  );
};

export default LeafletViewScreen;

