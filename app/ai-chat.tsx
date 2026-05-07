import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Send, Sparkles, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [input, setInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  console.log('[AIChatScreen] Rendering with', chatMessages.length, 'local messages');

  const { messages, sendMessage, error } = useRorkAgent({
    tools: {
      generateNote: createRorkTool({
        description: 'Generate a note based on a topic or idea provided by the user',
        zodSchema: z.object({
          title: z.string().describe('Title of the note'),
          content: z.string().describe('Content of the note'),
        }),
        execute(toolInput): string {
          console.log('[AIChat] Tool executed: generateNote with title:', toolInput.title);
          const msg: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            text: `📝 Generated note:\n\n**${toolInput.title}**\n\n${toolInput.content}`,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, msg]);
          return `Created note: ${toolInput.title}`;
        },
      }),
    },
  });

  const displayMessages = React.useMemo<ChatMessage[]>(() => {
    const fromAgent: ChatMessage[] = [];
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type === 'text' && part.text.trim()) {
          fromAgent.push({
            id: `${m.id}-${fromAgent.length}`,
            role: m.role as 'user' | 'assistant',
            text: part.text,
            timestamp: Date.now(),
          });
        }
      }
    }
    return [...fromAgent, ...chatMessages];
  }, [messages, chatMessages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    console.log('[AIChat] Sending message:', text.substring(0, 50));
    setInput('');
    sendMessage(text);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 250);
  }, [input, sendMessage]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    console.log('[AIChat] Suggestion tapped:', suggestion);
    setInput(suggestion);
  }, []);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.aiAvatar]}>
          {isUser ? (
            <User size={14} color="#fff" />
          ) : (
            <Sparkles size={14} color={Colors.accent} />
          )}
        </View>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const SUGGESTIONS = [
    'Brainstorm ideas for a project',
    'Help me write a meeting summary',
    'Create a to-do list for today',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="ai-chat-screen">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="btn-back-ai">
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={18} color={Colors.accent} />
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
          <Text style={styles.headerSubtitle}>Powered by NoteVault AI</Text>
        </View>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {displayMessages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.aiIconLarge}>
              <Sparkles size={32} color={Colors.accent} />
            </View>
            <Text style={styles.welcomeTitle}>NoteVault AI</Text>
            <Text style={styles.welcomeSubtitle}>
              Ask me anything — brainstorm ideas, draft notes, summarize content, or get writing help.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionChipPressed]}
                  onPress={() => handleSuggestionPress(s)}
                  testID={`suggestion-${i}`}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {error && (
          <View style={styles.errorBar}>
            <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          </View>
        )}

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask AI anything..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            testID="input-ai-chat"
          />
          <Pressable
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
            testID="btn-send-ai"
          >
            <Send size={18} color={input.trim() ? '#fff' : Colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  aiIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.3)',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  suggestions: {
    gap: 10,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  suggestionChipPressed: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  suggestionText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  userAvatar: {
    backgroundColor: Colors.accent,
  },
  aiAvatar: {
    backgroundColor: Colors.accentSoft,
    borderWidth: 0.5,
    borderColor: 'rgba(79,124,255,0.3)',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  errorBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,77,106,0.1)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,77,106,0.2)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: Colors.cardBorder,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.card,
    shadowOpacity: 0,
    elevation: 0,
  },
});
