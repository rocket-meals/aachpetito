import React, { useCallback, useEffect, useRef, useState } from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import type { MapMarker, LeafletWebViewEvent } from './model';
import { LeafletView, LatLng, MapMarker as LeafletViewMapMarkers } from 'react-native-leaflet-view';
import useSetPageTitle from "@/hooks/useSetPageTitle";
import {TranslationKeys} from "@/locales/keys";
import {Asset} from "expo-asset";
import * as FileSystem from "expo-file-system";
import {MyMapProps} from "@/components/MyMap/MyMapHelper";

const MyMap: React.FC<MyMapProps> = ({
  mapCenterPosition,
  zoom,
  mapMarkers,
  onMarkerClick,
  onMapEvent,
  renderMarkerModal,
  onMarkerSelectionChange,
}) => {
  const { theme } = useTheme();

  useSetPageTitle(TranslationKeys.leaflet_map);
  const [html, setHtml] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAssets = async () => {
      const htmlAsset = Asset.fromModule(require('@/assets/leaflet.html'));
      const iconAsset = Asset.fromModule(require('@/assets/map/marker-icon-2x.png'));
      await Promise.all([htmlAsset.downloadAsync(), iconAsset.downloadAsync()]);
      const [htmlContent, iconContent] = await Promise.all([
        FileSystem.readAsStringAsync(htmlAsset.localUri!),
        FileSystem.readAsStringAsync(iconAsset.localUri!, {
          encoding: FileSystem.EncodingType.Base64,
        }),
      ]);
      if (isMounted) {
        setHtml(htmlContent);
        setIcon(iconContent);
      }
    };
    loadAssets();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!html || !icon) {
    return <ActivityIndicator />;
  }

  let finalMapMarkers: LeafletViewMapMarkers[] = [];
  if (mapMarkers){
    finalMapMarkers = mapMarkers.map((marker: MapMarker) => ({
      id: marker.id,
      position: marker.position as LatLng,
      icon: marker.icon,
      size: marker.size || [32, 32],
    }));
  }
  finalMapMarkers.push( {
    id: 'berlin-icon',
    position: mapCenterPosition,
    icon: `<img src='data:image/png;base64,${icon}' style='width:32px;height:32px;' />`,
    size: [32, 32],
  })

  return (
      <View style={styles.container}>
        <LeafletView
            webviewStyle={styles.map}
            mapCenterPosition={mapCenterPosition}
            zoom={13}
            source={{ html }}
            mapMarkers={finalMapMarkers}
        />
      </View>
  );
};

export default MyMap;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'red',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

