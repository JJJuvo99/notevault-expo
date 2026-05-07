import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useNotes } from '@/providers/NotesProvider';
import NotebookCard from '@/components/NotebookCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NotebooksHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { notebooks, addNotebook, deleteNotebook } = useNotes();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newSubtitle, setNewSubtitle] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      console.log('[NotebooksHome] Not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    console.log('[NotebooksHome] Loaded with', notebooks.length, 'notebooks for user:', user?.name);
  }, [isAuthenticated, isLoading, fadeAnim, slideAnim, router, notebooks.length, user?.name]);

  const handleNotebookPress = useCallback((notebookId: string, notebookName: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[NotebooksHome] Pressed notebook:', notebookName);
    if (notebookName === 'Calendar') {
      router.push('/calendar');
      return;
    }
    if (notebookName === 'Journal') {
      router.push('/journal');
      return;
    }
    router.push({ pathname: '/notebook-detail', params: { id: notebookId } });
  }, [router]);

  const handleNotebookLongPress = useCallback((notebookId: string, notebookName: string) => {
    if (notebookName === 'Calendar' || notebookName === 'Journal') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      notebookName,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Notebook?',
              `This will permanently delete "${notebookName}" and all its notes.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    console.log('[NotebooksHome] Deleting notebook:', notebookName);
                    void deleteNotebook(notebookId);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteNotebook]);

  const handleAddNotebook = useCallback(async () => {
    if (!newName.trim()) {
      Alert.alert('Missing name', 'Please enter a notebook name.');
      return;
    }
    console.log('[NotebooksHome] Creating notebook:', newName.trim());
    await addNotebook(newName.trim(), newSubtitle.trim() || 'Notes');
    setNewName('');
    setNewSubtitle('');
    setShowAddModal(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newName, newSubtitle, addNotebook]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const CARD_SIZE = (SCREEN_WIDTH - 60) / 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="notebooks-home">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.tagline}>What are we doing today?</Text>
        </Animated.View>

        <Animated.View style={[styles.pinnedRow, { opacity: fadeAnim }]}>
          {notebooks.filter(nb => nb.name === 'Journal' || nb.name === 'Calendar').map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              hideSubtitle
              onPress={() => handleNotebookPress(notebook.id, notebook.name)}
              onLongPress={() => handleNotebookLongPress(notebook.id, notebook.name)}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
          {notebooks.filter(nb => nb.name !== 'Journal' && nb.name !== 'Calendar').map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              onPress={() => handleNotebookPress(notebook.id, notebook.name)}
              onLongPress={() => handleNotebookLongPress(notebook.id, notebook.name)}
            />
          ))}

          <Pressable
            style={[styles.addCard, { width: CARD_SIZE, height: CARD_SIZE, borderRadius: CARD_SIZE / 2 }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
            testID="btn-add-notebook"
          >
            <Plus size={28} color={Colors.accent} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Notebook</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Notebook name"
              placeholderTextColor={Colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              testID="input-notebook-name"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Subtitle (optional)"
              placeholderTextColor={Colors.textMuted}
              value={newSubtitle}
              onChangeText={setNewSubtitle}
              testID="input-notebook-subtitle"
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowAddModal(false);
                  setNewName('');
                  setNewSubtitle('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalCreateBtn}
                onPress={handleAddNotebook}
                testID="btn-create-notebook"
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 28,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  pinnedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(79, 124, 255, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(79, 124, 255, 0.04)',
  },
  addText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    height: 48,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  modalCreateBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCreateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
