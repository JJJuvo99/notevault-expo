import React, { useCallback, useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Block, BlockType } from '@/utils/blocks';
import { newBlock, uid } from '@/utils/blocks';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onRequestInsert: (afterId: string) => void;
  textColor: string;
  mutedColor: string;
  fontSize: number;
  lineSpacing: number;
  isLightBg: boolean;
}

function BlockEditorImpl({
  blocks,
  onChange,
  onRequestInsert,
  textColor,
  mutedColor,
  fontSize,
  lineSpacing,
  isLightBg,
}: BlockEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const updateBlock = useCallback(
    (id: string, patch: Partial<Block>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [blocks, onChange]
  );

  const removeBlock = useCallback(
    (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = blocks.filter((b) => b.id !== id);
      onChange(next.length > 0 ? next : [newBlock('text')]);
    },
    [blocks, onChange]
  );

  const transformBlock = useCallback(
    (id: string, type: BlockType) => {
      onChange(
        blocks.map((b) => {
          if (b.id !== id) return b;
          const created = newBlock(type);
          if (type === 'table' || type === 'divider' || type === 'image' || type === 'code') {
            return { ...created, id };
          }
          return { ...created, id, text: b.text ?? '' };
        })
      );
    },
    [blocks, onChange]
  );

  const insertAfter = useCallback(
    (id: string, type: BlockType = 'text') => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx === -1) return;
      const nb = newBlock(type);
      const next = [...blocks.slice(0, idx + 1), nb, ...blocks.slice(idx + 1)];
      onChange(next);
      setActiveId(nb.id);
    },
    [blocks, onChange]
  );

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => (
        <BlockRenderer
          key={block.id}
          block={block}
          isActive={activeId === block.id}
          onFocus={() => setActiveId(block.id)}
          onBlur={() => setActiveId((prev) => (prev === block.id ? null : prev))}
          onChange={(patch) => updateBlock(block.id, patch)}
          onRemove={() => removeBlock(block.id)}
          onTransform={(t) => transformBlock(block.id, t)}
          onSubmitEditing={() => insertAfter(block.id, 'text')}
          onInsertAfter={() => onRequestInsert(block.id)}
          textColor={textColor}
          mutedColor={mutedColor}
          fontSize={fontSize}
          lineSpacing={lineSpacing}
          isLightBg={isLightBg}
          isLast={idx === blocks.length - 1}
        />
      ))}

      <Pressable
        style={styles.addBlockBtn}
        onPress={() => {
          const last = blocks[blocks.length - 1];
          if (last) onRequestInsert(last.id);
        }}
      >
        <Plus size={14} color={mutedColor} />
        <Text style={[styles.addBlockText, { color: mutedColor }]}>Add block</Text>
      </Pressable>
    </View>
  );
}

interface BlockRendererProps {
  block: Block;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onTransform: (t: BlockType) => void;
  onSubmitEditing: () => void;
  onInsertAfter: () => void;
  textColor: string;
  mutedColor: string;
  fontSize: number;
  lineSpacing: number;
  isLightBg: boolean;
  isLast: boolean;
}

function BlockRenderer(props: BlockRendererProps) {
  const {
    block,
    isActive,
    onFocus,
    onBlur,
    onChange,
    onRemove,
    onSubmitEditing,
    onInsertAfter,
    textColor,
    mutedColor,
    fontSize,
    lineSpacing,
    isLightBg,
  } = props;

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      if (e.nativeEvent.key === 'Backspace' && (block.text ?? '').length === 0 && block.type !== 'divider') {
        onRemove();
      }
    },
    [block.text, block.type, onRemove]
  );

  const renderBody = () => {
    switch (block.type) {
      case 'h1':
      case 'h2':
      case 'h3': {
        const sizeMap = { h1: 28, h2: 22, h3: 18 } as const;
        const accent = block.type === 'h1' ? '#FF6B6B' : block.type === 'h2' ? '#FFA94D' : '#FFD43B';
        return (
          <View style={styles.headingWrap}>
            <View style={[styles.headingAccent, { backgroundColor: accent }]} />
            <TextInput
              style={[
                styles.heading,
                { fontSize: sizeMap[block.type], color: textColor },
              ]}
              value={block.text ?? ''}
              onChangeText={(t) => onChange({ text: t })}
              onFocus={onFocus}
              onBlur={onBlur}
              onSubmitEditing={onSubmitEditing}
              onKeyPress={handleKeyPress}
              placeholder={`Heading ${block.type.slice(1)}`}
              placeholderTextColor={mutedColor}
              blurOnSubmit
              returnKeyType="next"
            />
          </View>
        );
      }
      case 'quote':
        return (
          <View style={[styles.quoteWrap, { borderLeftColor: '#66D9EF' }]}>
            <TextInput
              style={[styles.quote, { color: textColor, fontSize, lineHeight: lineSpacing }]}
              value={block.text ?? ''}
              onChangeText={(t) => onChange({ text: t })}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyPress={handleKeyPress}
              placeholder="Quote..."
              placeholderTextColor={mutedColor}
              multiline
            />
          </View>
        );
      case 'callout':
        return (
          <View style={styles.calloutWrap}>
            <Text style={styles.calloutEmoji}>💡</Text>
            <TextInput
              style={[styles.calloutText, { color: textColor, fontSize, lineHeight: lineSpacing }]}
              value={block.text ?? ''}
              onChangeText={(t) => onChange({ text: t })}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyPress={handleKeyPress}
              placeholder="Type a callout note..."
              placeholderTextColor={mutedColor}
              multiline
            />
          </View>
        );
      case 'bullet':
        return (
          <View style={styles.listRow}>
            <View style={[styles.bulletDot, { backgroundColor: textColor }]} />
            <TextInput
              style={[styles.listText, { color: textColor, fontSize, lineHeight: lineSpacing }]}
              value={block.text ?? ''}
              onChangeText={(t) => onChange({ text: t })}
              onFocus={onFocus}
              onBlur={onBlur}
              onSubmitEditing={onSubmitEditing}
              onKeyPress={handleKeyPress}
              placeholder="List item"
              placeholderTextColor={mutedColor}
              blurOnSubmit
              returnKeyType="next"
            />
          </View>
        );
      case 'numbered':
        return (
          <View style={styles.listRow}>
            <Text style={[styles.numberedDot, { color: textColor, fontSize }]}>1.</Text>
            <TextInput
              style={[styles.listText, { color: textColor, fontSize, lineHeight: lineSpacing }]}
              value={block.text ?? ''}
              onChangeText={(t) => onChange({ text: t })}
              onFocus={onFocus}
              onBlur={onBlur}
              onSubmitEditing={onSubmitEditing}
              onKeyPress={handleKeyPress}
              placeholder="List item"
              placeholderTextColor={mutedColor}
              blurOnSubmit
              returnKeyType="next"
            />
          </View>
        );
      case 'checklist':
        return (
          <View style={styles.listRow}>
            <Pressable
              onPress={() => {
                onChange({ checked: !block.checked });
                void Haptics.selectionAsync();
              }}
              style={[
                styles.checkbox,
                block.checked && styles.checkboxChecked,
              ]}
            >
              {block.checked ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
            </Pressable>
            <TextInput
              style={[
                styles.listText,
                {
                  color: block.checked ? mutedColor : textColor,
                  fontSize,
                  lineHeight: lineSpacing,
                  textDecorationLine: block.checked ? 'line-through' : 'none',
                },
              ]}
              value={block.text ?? ''}
              onChangeText={(t) => onChange({ text: t })}
              onFocus={onFocus}
              onBlur={onBlur}
              onSubmitEditing={onSubmitEditing}
              onKeyPress={handleKeyPress}
              placeholder="To-do"
              placeholderTextColor={mutedColor}
              blurOnSubmit
              returnKeyType="next"
            />
          </View>
        );
      case 'divider':
        return (
          <View style={styles.dividerWrap}>
            <View style={[styles.divider, { backgroundColor: isLightBg ? '#D0D0D8' : Colors.cardBorder }]} />
          </View>
        );
      case 'code':
        return <CodeBlockView block={block} onChange={onChange} onFocus={onFocus} onBlur={onBlur} />;
      case 'table':
        return (
          <TableBlockView
            block={block}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            isLightBg={isLightBg}
          />
        );
      case 'image':
        return (
          <ImageBlockView
            block={block}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            textColor={textColor}
            mutedColor={mutedColor}
            isLightBg={isLightBg}
          />
        );
      case 'text':
      default:
        return (
          <TextInput
            style={[
              styles.paragraph,
              { color: textColor, fontSize, lineHeight: lineSpacing },
            ]}
            value={block.text ?? ''}
            onChangeText={(t) => onChange({ text: t })}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={handleKeyPress}
            placeholder={isActive ? "Type '/' for commands or just write…" : ' '}
            placeholderTextColor={mutedColor}
            multiline
            scrollEnabled={false}
          />
        );
    }
  };

  return (
    <View style={[styles.blockRow, isActive && styles.blockRowActive]}>
      <View style={styles.blockGutter}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onInsertAfter();
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.gutterBtn,
            { opacity: isActive ? 1 : 0.0001 },
            pressed && { backgroundColor: Colors.card },
          ]}
        >
          <Plus size={14} color={mutedColor} />
        </Pressable>
        <Pressable
          onPress={() => onRemove()}
          onLongPress={() => onRemove()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.gutterBtn,
            { opacity: isActive ? 1 : 0.0001 },
            pressed && { backgroundColor: Colors.card },
          ]}
        >
          <GripVertical size={14} color={mutedColor} />
        </Pressable>
      </View>
      <View style={styles.blockBody}>{renderBody()}</View>
    </View>
  );
}

function CodeBlockView({
  block,
  onChange,
  onFocus,
  onBlur,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <View style={styles.codeDots}>
          <View style={[styles.codeDot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.codeDot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.codeDot, { backgroundColor: '#28C840' }]} />
        </View>
        <View style={styles.codeLangBadge}>
          <Text style={styles.codeLangText}>{block.language ?? 'plaintext'}</Text>
        </View>
      </View>
      <TextInput
        style={styles.codeInput}
        value={block.text ?? ''}
        onChangeText={(t) => onChange({ text: t })}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="// write code here"
        placeholderTextColor="#6B7280"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
}

function TableBlockView({
  block,
  onChange,
  onFocus,
  onBlur,
  isLightBg,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onFocus: () => void;
  onBlur: () => void;
  isLightBg: boolean;
}) {
  const rows = block.rows ?? [];
  const cols = rows[0]?.length ?? 0;

  const updateCell = (r: number, c: number, value: string) => {
    const next = rows.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? value : cell))
    );
    onChange({ rows: next });
  };

  const addRow = () => {
    void Haptics.selectionAsync();
    onChange({ rows: [...rows, Array.from({ length: cols }, () => '')] });
  };

  const addCol = () => {
    void Haptics.selectionAsync();
    onChange({ rows: rows.map((row, i) => [...row, i === 0 ? `Header ${cols + 1}` : '']) });
  };

  const removeRow = () => {
    if (rows.length <= 2) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ rows: rows.slice(0, -1) });
  };

  const removeCol = () => {
    if (cols <= 1) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ rows: rows.map((row) => row.slice(0, -1)) });
  };

  const cellBg = isLightBg ? '#FFFFFF' : '#0F1729';
  const headerBg = isLightBg ? '#F3F4F8' : '#1A2236';
  const borderC = isLightBg ? '#D0D0D8' : Colors.cardBorder;
  const textC = isLightBg ? '#1A1A2E' : Colors.text;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={[styles.tableContainer, { borderColor: borderC }]}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.tableRow}>
              {row.map((cell, ci) => (
                <TextInput
                  key={ci}
                  style={[
                    styles.tableCell,
                    { borderColor: borderC, color: textC, backgroundColor: ri === 0 ? headerBg : cellBg },
                    ri === 0 && styles.tableHeaderCell,
                  ]}
                  value={cell}
                  onChangeText={(t) => updateCell(ri, ci, t)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder={ri === 0 ? `Header ${ci + 1}` : ''}
                  placeholderTextColor={isLightBg ? '#999' : Colors.textMuted}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.tableActions}>
        <Pressable style={styles.tableActionBtn} onPress={addRow}>
          <Plus size={12} color={Colors.accent} />
          <Text style={styles.tableActionText}>Row</Text>
        </Pressable>
        <Pressable style={styles.tableActionBtn} onPress={addCol}>
          <Plus size={12} color={Colors.accent} />
          <Text style={styles.tableActionText}>Column</Text>
        </Pressable>
        <Pressable style={[styles.tableActionBtn, styles.tableActionBtnDanger]} onPress={removeRow}>
          <Trash2 size={12} color={Colors.danger} />
          <Text style={[styles.tableActionText, { color: Colors.danger }]}>Row</Text>
        </Pressable>
        <Pressable style={[styles.tableActionBtn, styles.tableActionBtnDanger]} onPress={removeCol}>
          <Trash2 size={12} color={Colors.danger} />
          <Text style={[styles.tableActionText, { color: Colors.danger }]}>Column</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ImageBlockView({
  block,
  onChange,
  onFocus,
  onBlur,
  textColor,
  mutedColor,
  isLightBg,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onFocus: () => void;
  onBlur: () => void;
  textColor: string;
  mutedColor: string;
  isLightBg: boolean;
}) {
  const [expanded, setExpanded] = useState<boolean>(!block.url);
  return (
    <View style={[styles.imageBlock, { backgroundColor: isLightBg ? '#F3F4F8' : Colors.card, borderColor: isLightBg ? '#D0D0D8' : Colors.cardBorder }]}>
      {block.url ? (
        <View style={styles.imagePreview}>
          {Platform.OS === 'web' ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            React.createElement('img' as any, { src: block.url, style: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 } })
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ color: textColor, fontSize: 12 }}>{block.url}</Text>
            </View>
          )}
        </View>
      ) : null}
      <Pressable style={styles.imageToggle} onPress={() => setExpanded((e) => !e)}>
        {expanded ? <ChevronDown size={14} color={mutedColor} /> : <ChevronRight size={14} color={mutedColor} />}
        <Text style={[styles.imageLabel, { color: mutedColor }]}>Image URL</Text>
      </Pressable>
      {expanded ? (
        <>
          <TextInput
            style={[styles.imageInput, { color: textColor, borderColor: isLightBg ? '#D0D0D8' : Colors.inputBorder, backgroundColor: isLightBg ? '#fff' : Colors.inputBg }]}
            value={block.url ?? ''}
            onChangeText={(t) => onChange({ url: t })}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="https://..."
            placeholderTextColor={mutedColor}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.imageInput, { color: textColor, borderColor: isLightBg ? '#D0D0D8' : Colors.inputBorder, backgroundColor: isLightBg ? '#fff' : Colors.inputBg }]}
            value={block.caption ?? ''}
            onChangeText={(t) => onChange({ caption: t })}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Caption (optional)"
            placeholderTextColor={mutedColor}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 2,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
    borderRadius: 6,
  },
  blockRowActive: {},
  blockGutter: {
    width: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
  },
  gutterBtn: {
    width: 16,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  blockBody: {
    flex: 1,
    paddingRight: 12,
  },
  paragraph: {
    paddingVertical: 4,
    minHeight: 24,
  },
  headingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  headingAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  heading: {
    flex: 1,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  quoteWrap: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  quote: {
    fontStyle: 'italic' as const,
  },
  calloutWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251,191,36,0.10)',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  calloutEmoji: {
    fontSize: 18,
  },
  calloutText: {
    flex: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 3,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 11,
    marginLeft: 3,
  },
  numberedDot: {
    minWidth: 18,
    marginTop: 1,
    fontWeight: '600' as const,
  },
  listText: {
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
  },
  dividerWrap: {
    paddingVertical: 12,
  },
  divider: {
    height: 1,
  },
  codeBlock: {
    backgroundColor: '#0D1117',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  codeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  codeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  codeLangBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeLangText: {
    color: '#A9DC76',
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeInput: {
    color: '#E6EDF3',
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    minWidth: 110,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    fontSize: 14,
  },
  tableHeaderCell: {
    fontWeight: '700' as const,
  },
  tableActions: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
  },
  tableActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.accentSoft,
  },
  tableActionBtnDanger: {
    backgroundColor: 'rgba(255,77,106,0.12)',
  },
  tableActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  imageBlock: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  imagePreview: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  imageInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  addBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingLeft: 40,
    opacity: 0.6,
  },
  addBlockText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
});

export default memo(BlockEditorImpl);
