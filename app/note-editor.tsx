import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Mic,
  MicOff,
  Wand2,
  Sparkles,
  Settings2,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Colors from '@/constants/colors';
import { useNotes, useNoteById } from '@/providers/NotesProvider';
import { generateText } from '@rork-ai/toolkit-sdk';
import NoteSettingsPanel from '@/components/NoteSettingsPanel';
import BlockEditor from '@/components/BlockEditor';
import BlockInsertMenu from '@/components/BlockInsertMenu';
import {
  parseContent,
  serializeBlocks,
  blocksToPlainText,
  newBlock,
  mapBlockTypeFromMarkdown,
  type Block,
  type BlockType,
} from '@/utils/blocks';

export default function NoteEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { noteId, notebookId } = useLocalSearchParams<{ noteId?: string; notebookId: string }>();
  const existingNote = useNoteById(noteId ?? '');
  const { addNote, updateNote } = useNotes();

  const [title, setTitle] = useState<string>(existingNote?.title ?? '');
  const [blocks, setBlocks] = useState<Block[]>(() => parseContent(existingNote?.content));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isAIProcessing, setIsAIProcessing] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showBlockMenu, setShowBlockMenu] = useState<boolean>(false);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>(Colors.background);
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineSpacing, setLineSpacing] = useState<number>(24);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef<Block[]>(blocks);
  const titleRef = useRef<string>(title);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  console.log('[NoteEditor] Rendering, noteId:', noteId ?? 'new', 'notebookId:', notebookId, 'blocks:', blocks.length);

  const isLightBg = backgroundColor.startsWith('#F') || backgroundColor.startsWith('#f') || backgroundColor === '#FFF8F0';
  const textColor = isLightBg ? '#1A1A2E' : Colors.text;
  const textSecondaryColor = isLightBg ? '#555' : Colors.textSecondary;
  const mutedColor = isLightBg ? '#999' : Colors.textMuted;
  const surfaceColor = isLightBg ? '#E8E8EC' : Colors.surface;
  const borderColor = isLightBg ? '#D0D0D8' : Colors.cardBorder;

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    if (!noteId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (noteId) {
        const content = serializeBlocks(blocksRef.current);
        const plain = blocksToPlainText(blocksRef.current);
        console.log('[NoteEditor] Auto-saving note:', noteId);
        void updateNote(noteId, {
          title: titleRef.current || 'Untitled',
          content,
          plainText: plain,
        });
      }
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [blocks, title, noteId, updateNote]);

  const plainText = useMemo(() => blocksToPlainText(blocks), [blocks]);

  const handleSave = useCallback(async () => {
    const plain = blocksToPlainText(blocks);
    if (!plain.trim() && !title.trim()) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      const content = serializeBlocks(blocks);
      if (noteId) {
        await updateNote(noteId, {
          title: title || 'Untitled',
          content,
          plainText: plain,
        });
      } else {
        await addNote(notebookId ?? '', title || 'Untitled', content, plain);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.log('[NoteEditor] Save error:', e);
      Alert.alert('Save Error', 'Failed to save your note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [blocks, title, noteId, notebookId, updateNote, addNote, router]);

  const startRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Voice recording is not supported on web. Please use the mobile app.');
        return;
      }
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone access to use voice transcription.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: { extension: '.m4a', outputFormat: 3, audioEncoder: 3 },
        ios: { extension: '.wav', outputFormat: 1, audioQuality: 127, sampleRate: 44100, numberOfChannels: 1, bitRate: 128000 },
        web: {},
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log('[NoteEditor] Recording start error:', e);
      Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const appendTextBlock = useCallback((text: string) => {
    setBlocks((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === 'text' && (!last.text || last.text.length === 0)) {
        return prev.map((b, i) => (i === prev.length - 1 ? { ...b, text } : b));
      }
      return [...prev, { ...newBlock('text'), text }];
    });
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) {
        setIsTranscribing(false);
        return;
      }
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const formData = new FormData();
      const audioFile = { uri, name: 'recording.' + fileType, type: 'audio/' + fileType };
      formData.append('audio', audioFile as unknown as Blob);
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data?.text) {
        appendTextBlock(data.text);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log('[NoteEditor] Transcription error:', e);
      Alert.alert('Transcription Error', 'Failed to transcribe your audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [appendTextBlock]);

  const handleAIAssist = useCallback(async () => {
    if (!plainText.trim()) {
      Alert.alert('No Content', 'Write some text first, then AI can help you improve it.');
      return;
    }
    Alert.alert('AI Writing Assistant', 'Choose what you want AI to do:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Summarize',
        onPress: async () => {
          setIsAIProcessing(true);
          try {
            const result = await generateText({
              messages: [{ role: 'user', content: `Summarize the following text concisely:\n\n${plainText}` }],
            });
            setBlocks((prev) => [
              ...prev,
              { ...newBlock('h2'), text: 'Summary' },
              { ...newBlock('text'), text: String(result) },
            ]);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            console.log('[NoteEditor] AI summarize error:', e);
            Alert.alert('AI Error', 'Failed to generate summary.');
          } finally {
            setIsAIProcessing(false);
          }
        },
      },
      {
        text: 'Expand',
        onPress: async () => {
          setIsAIProcessing(true);
          try {
            const result = await generateText({
              messages: [{ role: 'user', content: `Expand on the following text with more detail:\n\n${plainText}` }],
            });
            setBlocks((prev) => [...prev, { ...newBlock('text'), text: String(result) }]);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            console.log('[NoteEditor] AI expand error:', e);
            Alert.alert('AI Error', 'Failed to expand text.');
          } finally {
            setIsAIProcessing(false);
          }
        },
      },
      {
        text: 'Rewrite',
        onPress: async () => {
          setIsAIProcessing(true);
          try {
            const result = await generateText({
              messages: [
                {
                  role: 'user',
                  content: `Rewrite the following text to be clearer and more professional. Return ONLY the rewritten text, no markdown:\n\n${plainText}`,
                },
              ],
            });
            setBlocks([{ ...newBlock('text'), text: String(result) }]);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            console.log('[NoteEditor] AI rewrite error:', e);
            Alert.alert('AI Error', 'Failed to rewrite text.');
          } finally {
            setIsAIProcessing(false);
          }
        },
      },
    ]);
  }, [plainText]);

  const handleRequestInsert = useCallback((afterId: string) => {
    void Haptics.selectionAsync();
    setInsertAfterId(afterId);
    setShowBlockMenu(true);
  }, []);

  const handleMenuInsert = useCallback(
    (markdown: string) => {
      const type = mapBlockTypeFromMarkdown(markdown);
      const finalType: BlockType = (() => {
        if (type) return type;
        if (markdown.includes('```')) return 'code';
        if (markdown.includes('|')) return 'table';
        return 'text';
      })();
      const created = newBlock(finalType);
      if (finalType === 'code') {
        const langMatch = markdown.match(/```(\w+)/);
        if (langMatch) created.language = langMatch[1];
      }
      if (finalType === 'table') {
        const tableLines = markdown.split('\n').filter((l) => /^\|/.test(l.trim()));
        const filtered = tableLines.filter((l) => !/^\|\s*-+/.test(l) && !/^\|\s*:?-+:?\s*\|/.test(l));
        const rows = filtered.map((l) =>
          l
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => c.trim())
        );
        if (rows.length > 0) created.rows = rows;
      }
      setBlocks((prev) => {
        const idx = insertAfterId ? prev.findIndex((b) => b.id === insertAfterId) : prev.length - 1;
        const insertAt = idx >= 0 ? idx + 1 : prev.length;
        return [...prev.slice(0, insertAt), created, ...prev.slice(insertAt)];
      });
      setShowBlockMenu(false);
      setInsertAfterId(null);
    },
    [insertAfterId]
  );

  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]} testID="note-editor-screen">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: surfaceColor }]}
          testID="btn-back-editor"
        >
          <ArrowLeft size={20} color={textColor} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            {noteId ? 'Edit Note' : 'New Note'}
          </Text>
          <Text style={[styles.wordCount, { color: mutedColor }]}>
            {wordCount} words · {charCount} chars
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={[styles.headerBtn, { backgroundColor: surfaceColor }]}
            testID="btn-settings-editor"
          >
            <Settings2 size={18} color={textSecondaryColor} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={[styles.headerBtn, styles.saveBtn]}
            disabled={isSaving}
            testID="btn-save-editor"
          >
            {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Check size={20} color="#fff" />}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TextInput
            style={[styles.titleInput, { color: textColor }]}
            placeholder="Untitled"
            placeholderTextColor={mutedColor}
            value={title}
            onChangeText={setTitle}
            testID="input-note-title"
          />

          <View style={[styles.titleDivider, { backgroundColor: borderColor }]} />

          <BlockEditor
            blocks={blocks}
            onChange={setBlocks}
            onRequestInsert={handleRequestInsert}
            textColor={textColor}
            mutedColor={mutedColor}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            isLightBg={isLightBg}
          />
        </ScrollView>

        {(isTranscribing || isAIProcessing) && (
          <View style={[styles.processingBar, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
            <ActivityIndicator color={Colors.accent} size="small" />
            <Text style={styles.processingText}>
              {isTranscribing ? 'Transcribing audio...' : 'AI is thinking...'}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: surfaceColor, borderTopColor: borderColor },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomBarRow}
          >
            <Pressable
              style={[styles.bottomBtn, styles.bottomBtnPrimary]}
              onPress={() => {
                void Haptics.selectionAsync();
                const last = blocks[blocks.length - 1];
                setInsertAfterId(last?.id ?? null);
                setShowBlockMenu(true);
              }}
              testID="btn-insert-block"
            >
              <Plus size={18} color="#fff" />
              <Text style={[styles.bottomBtnText, { color: '#fff' }]}>Block</Text>
            </Pressable>

            <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
              <Pressable
                style={[styles.bottomBtn, isRecording && styles.bottomBtnRecording]}
                onPress={isRecording ? stopRecording : startRecording}
                testID="btn-mic-editor"
              >
                {isRecording ? <MicOff size={18} color={Colors.danger} /> : <Mic size={18} color={Colors.accent} />}
                <Text style={[styles.bottomBtnText, isRecording && { color: Colors.danger }]}>
                  {isRecording ? 'Stop' : 'Voice'}
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable style={styles.bottomBtn} onPress={handleAIAssist} testID="btn-ai-assist-editor">
              <Wand2 size={18} color="#845EF7" />
              <Text style={[styles.bottomBtnText, { color: '#845EF7' }]}>AI Assist</Text>
            </Pressable>

            <Pressable
              style={styles.bottomBtn}
              onPress={() => router.push({ pathname: '/ai-chat', params: { notebookId } })}
              testID="btn-ai-chat-editor"
            >
              <Sparkles size={18} color={Colors.warning} />
              <Text style={[styles.bottomBtnText, { color: Colors.warning }]}>AI Chat</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <BlockInsertMenu
        visible={showBlockMenu}
        onClose={() => {
          setShowBlockMenu(false);
          setInsertAfterId(null);
        }}
        onInsert={handleMenuInsert}
      />

      <NoteSettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        backgroundColor={backgroundColor}
        onBackgroundChange={setBackgroundColor}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        lineSpacing={lineSpacing}
        onLineSpacingChange={setLineSpacing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  wordCount: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  titleInput: {
    fontSize: 30,
    fontWeight: '800' as const,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    letterSpacing: -0.5,
  },
  titleDivider: {
    height: 1,
    marginHorizontal: 20,
    opacity: 0.3,
    marginBottom: 4,
  },
  processingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  processingText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  bottomBar: {
    borderTopWidth: 0.5,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  bottomBarRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(79,124,255,0.08)',
  },
  bottomBtnPrimary: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomBtnRecording: {
    backgroundColor: 'rgba(255,77,106,0.12)',
  },
  bottomBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
});
