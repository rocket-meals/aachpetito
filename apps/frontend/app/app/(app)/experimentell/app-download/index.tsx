import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import styles from './styles';
import { getImageUrl } from '@/constants/HelperFunctions';
import RedirectButton from '@/components/RedirectButton';
import QRCode from 'qrcode';
import { SvgXml } from 'react-native-svg';
import CardDimensionHelper from '@/helper/CardDimensionHelper';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo, appSettings } = useSelector((state: RootState) => state.settings);
  const [projectName, setProjectName] = useState('');
  const [iosQr, setIosQr] = useState<string>('');
  const [androidQr, setAndroidQr] = useState<string>('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);


  const log = (msg: string) => setDebugLogs((logs) => [...logs, msg]);

  const qrOptions = {
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#010599FF',
      light: '#FFBF60FF',
    },
  };

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (serverInfo && serverInfo.info) {
      setProjectName(serverInfo.info.project.project_name);
    }
  }, [serverInfo]);

  useEffect(() => {
    if (appSettings?.app_stores_url_to_apple) {
      log(`Generate iOS QR for ${appSettings.app_stores_url_to_apple}`);
      QRCode.toString(
        appSettings.app_stores_url_to_apple,
        { type: 'svg', errorCorrectionLevel: 'H', margin: 1, color: qrOptions.color },
        (err, svg) => {
          if (err) {
            console.error(err);
            log(`iOS QR error: ${err}`);
            return;
          }
          setIosQr(svg);
          log('iOS QR created');
        }
      );
    }
    if (appSettings?.app_stores_url_to_google) {
      log(`Generate Android QR for ${appSettings.app_stores_url_to_google}`);
      QRCode.toString(
        appSettings.app_stores_url_to_google,
        { type: 'svg', errorCorrectionLevel: 'H', margin: 1, color: qrOptions.color },
        (err, svg) => {
          if (err) {
            console.error(err);
            log(`Android QR error: ${err}`);
            return;
          }
          setAndroidQr(svg);
          log('Android QR created');
        }
      );
    }
  }, [appSettings]);

  const openInBrowser = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      }
    } catch (e) {
      console.error('Error opening url', e);
    }
  };

  const projectLogo =
    serverInfo?.info?.project?.project_logo &&
    getImageUrl(serverInfo.info.project.project_logo);

  const iconSource = projectLogo
    ? { uri: projectLogo }
    : require('../../../../assets/images/icon.png');

  const qrSize = CardDimensionHelper.getCardDimension(screenWidth);

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
      contentContainerStyle={{
        ...styles.contentContainer,
        backgroundColor: theme.screen.background,
      }}
    >
      <View style={styles.content}>
        <Image source={iconSource} style={styles.icon} />
        <Text style={{ ...styles.heading, color: theme.screen.text }}>{projectName}</Text>
        <View style={styles.qrRow}>
          {appSettings?.app_stores_url_to_apple ? (
            <View style={styles.qrCol}>
              <Text selectable style={styles.urlText}>
                {appSettings.app_stores_url_to_apple}
              </Text>
              <View style={styles.qrDebugWrapper}>
                {iosQr ? (
                  Platform.OS === 'web' ? (
                    <div
                      style={{ width: qrSize, height: qrSize }}
                      dangerouslySetInnerHTML={{ __html: iosQr }}
                    />
                  ) : (
                    <SvgXml xml={iosQr} width={qrSize} height={qrSize} />
                  )
                ) : null}
              </View>
              {iosQr ? (
                <Text selectable style={styles.uriText}>{iosQr}</Text>
              ) : null}
              <RedirectButton
                label='iOS'
                onClick={() =>
                  appSettings?.app_stores_url_to_apple &&
                  openInBrowser(appSettings.app_stores_url_to_apple)
                }
              />
            </View>
          ) : null}
          {appSettings?.app_stores_url_to_google ? (
            <View style={styles.qrCol}>
              <Text selectable style={styles.urlText}>
                {appSettings.app_stores_url_to_google}
              </Text>
              <View style={styles.qrDebugWrapper}>
                {androidQr ? (
                  Platform.OS === 'web' ? (
                    <div
                      style={{ width: qrSize, height: qrSize }}
                      dangerouslySetInnerHTML={{ __html: androidQr }}
                    />
                  ) : (
                    <SvgXml xml={androidQr} width={qrSize} height={qrSize} />
                  )
                ) : null}
              </View>
              {androidQr ? (
                <Text selectable style={styles.uriText}>{androidQr}</Text>
              ) : null}
              <RedirectButton
                label='Android'
                onClick={() =>
                  appSettings?.app_stores_url_to_google &&
                  openInBrowser(appSettings.app_stores_url_to_google)
                }
              />
            </View>
          ) : null}
        </View>
        {debugLogs.length > 0 && (
          <View style={styles.debugLogContainer}>
            <ScrollView>
              {debugLogs.map((l, i) => (
                <Text key={i} style={styles.debugLogText}>
                  {l}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AppDownload;
