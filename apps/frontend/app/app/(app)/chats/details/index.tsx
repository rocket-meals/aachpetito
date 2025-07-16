import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams } from 'expo-router';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import MyMarkdown from '@/components/MyMarkdown/MyMarkdown';
import styles from './styles';

interface ChatMessage {
  id: string;
  chat_id: string;
  profile_id: string;
  text: string;
  timestamp: string;
}

const MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    chat_id: '1',
    profile_id: '1',
    text: 'Hallo **Welt**!',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'm2',
    chat_id: '1',
    profile_id: '2',
    text: 'Willkommen im Chat.',
    timestamp: new Date(Date.now() - 1000000).toISOString(),
  },
];

const ChatDetailsScreen = () => {
  useSetPageTitle(TranslationKeys.chat);
  const { theme } = useTheme();
  const { chat_id } = useLocalSearchParams<{ chat_id?: string }>();

  const chatMessages = MESSAGES.filter((m) => m.chat_id === chat_id);
  chatMessages.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageItem}>
      <Text style={{ ...styles.timestamp, color: theme.screen.text }}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
      <MyMarkdown content={item.text} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default ChatDetailsScreen;
