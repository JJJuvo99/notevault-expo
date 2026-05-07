import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';

interface MarkdownPreviewProps {
  content: string;
  backgroundColor?: string;
}

interface ParsedLine {
  type: 'h1' | 'h2' | 'h3' | 'quote' | 'bullet' | 'numbered' | 'checklist_checked' | 'checklist_unchecked' | 'divider' | 'code_start' | 'code_end' | 'code_line' | 'table_header' | 'table_separator' | 'table_row' | 'callout' | 'text' | 'empty';
  content: string;
  language?: string;
}

function parseLines(content: string): ParsedLine[] {
  const lines = content.split('\n');
  const parsed: ParsedLine[] = [];
  let inCodeBlock = false;
  let codeLang = '';

  for (const line of lines) {
    if (line.startsWith('```') && !inCodeBlock) {
      inCodeBlock = true;
      codeLang = line.slice(3).trim();
      parsed.push({ type: 'code_start', content: codeLang, language: codeLang });
      continue;
    }
    if (line.startsWith('```') && inCodeBlock) {
      inCodeBlock = false;
      parsed.push({ type: 'code_end', content: '' });
      codeLang = '';
      continue;
    }
    if (inCodeBlock) {
      parsed.push({ type: 'code_line', content: line, language: codeLang });
      continue;
    }

    if (line.trim() === '') {
      parsed.push({ type: 'empty', content: '' });
    } else if (line.startsWith('### ')) {
      parsed.push({ type: 'h3', content: line.slice(4) });
    } else if (line.startsWith('## ')) {
      parsed.push({ type: 'h2', content: line.slice(3) });
    } else if (line.startsWith('# ')) {
      parsed.push({ type: 'h1', content: line.slice(2) });
    } else if (/^>\s\*\*Note:\*\*/.test(line) || /^>\s\*\*Warning:\*\*/.test(line) || /^>\s\*\*Tip:\*\*/.test(line) || /^>\s\*\*Info:\*\*/.test(line)) {
      parsed.push({ type: 'callout', content: line.slice(2) });
    } else if (line.startsWith('> ')) {
      parsed.push({ type: 'quote', content: line.slice(2) });
    } else if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      parsed.push({ type: 'checklist_checked', content: line.slice(6) });
    } else if (line.startsWith('- [ ] ')) {
      parsed.push({ type: 'checklist_unchecked', content: line.slice(6) });
    } else if (line.startsWith('- ')) {
      parsed.push({ type: 'bullet', content: line.slice(2) });
    } else if (/^\d+\.\s/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      parsed.push({ type: 'numbered', content: numMatch ? numMatch[2] : line });
    } else if (line.trim() === '---') {
      parsed.push({ type: 'divider', content: '' });
    } else if (line.startsWith('|') && line.includes('---')) {
      parsed.push({ type: 'table_separator', content: line });
    } else if (line.startsWith('|')) {
      const prevNonEmpty = [...parsed].reverse().find((p) => p.type !== 'empty');
      const isHeader = !prevNonEmpty || (prevNonEmpty.type !== 'table_separator' && prevNonEmpty.type !== 'table_row' && prevNonEmpty.type !== 'table_header');
      parsed.push({ type: isHeader ? 'table_header' : 'table_row', content: line });
    } else {
      parsed.push({ type: 'text', content: line });
    }
  }

  return parsed;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns: Array<{ regex: RegExp; render: (match: string, full?: RegExpExecArray) => React.ReactNode }> = [
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m) => <Text key={key++} style={previewStyles.bold}>{m}</Text>,
    },
    {
      regex: /`(.+?)`/,
      render: (m) => <Text key={key++} style={previewStyles.inlineCode}>{m}</Text>,
    },
    {
      regex: /_(.+?)_/,
      render: (m) => <Text key={key++} style={previewStyles.italic}>{m}</Text>,
    },
    {
      regex: /~~(.+?)~~/,
      render: (m) => <Text key={key++} style={previewStyles.strikethrough}>{m}</Text>,
    },
    {
      regex: /\[(.+?)\]\((.+?)\)/,
      render: (m) => <Text key={key++} style={previewStyles.link}>{m}</Text>,
    },
  ];

  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; node: React.ReactNode } | null = null;

    for (const pattern of patterns) {
      const match = pattern.regex.exec(remaining);
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = {
          index: match.index,
          length: match[0].length,
          node: pattern.render(match[1], match),
        };
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > 0) {
        parts.push(<Text key={key++}>{remaining.slice(0, earliestMatch.index)}</Text>);
      }
      parts.push(earliestMatch.node);
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      parts.push(<Text key={key++}>{remaining}</Text>);
      break;
    }
  }

  return parts;
}

function parseTableCells(line: string): string[] {
  return line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map((c) => c.trim());
}

function getLineNumbers(startNum: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => startNum + i);
}

export default function MarkdownPreview({ content, backgroundColor }: MarkdownPreviewProps) {
  const parsed = useMemo(() => parseLines(content), [content]);

  let codeLineNum = 0;

  const renderLine = (line: ParsedLine, index: number) => {
    switch (line.type) {
      case 'h1':
        return (
          <View key={index} style={previewStyles.h1Container}>
            <Text style={previewStyles.h1}>
              {renderInlineFormatting(line.content)}
            </Text>
            <View style={previewStyles.h1Underline} />
          </View>
        );
      case 'h2':
        return (
          <View key={index} style={previewStyles.h2Container}>
            <Text style={previewStyles.h2}>
              {renderInlineFormatting(line.content)}
            </Text>
            <View style={previewStyles.h2Underline} />
          </View>
        );
      case 'h3':
        return (
          <View key={index} style={previewStyles.h3Container}>
            <View style={previewStyles.h3Accent} />
            <Text style={previewStyles.h3}>
              {renderInlineFormatting(line.content)}
            </Text>
          </View>
        );
      case 'callout':
        return (
          <View key={index} style={previewStyles.calloutBlock}>
            <View style={previewStyles.calloutBorder} />
            <Text style={previewStyles.calloutText}>
              {renderInlineFormatting(line.content)}
            </Text>
          </View>
        );
      case 'quote':
        return (
          <View key={index} style={previewStyles.quoteBlock}>
            <View style={previewStyles.quoteBorder} />
            <Text style={previewStyles.quoteText}>
              {renderInlineFormatting(line.content)}
            </Text>
          </View>
        );
      case 'bullet':
        return (
          <View key={index} style={previewStyles.listItem}>
            <View style={previewStyles.bulletDot} />
            <Text style={previewStyles.listText}>
              {renderInlineFormatting(line.content)}
            </Text>
          </View>
        );
      case 'numbered': {
        return (
          <View key={index} style={previewStyles.listItem}>
            <View style={previewStyles.numberedBadge}>
              <Text style={previewStyles.numberedBadgeText}>
                {index + 1}
              </Text>
            </View>
            <Text style={previewStyles.listText}>
              {renderInlineFormatting(line.content)}
            </Text>
          </View>
        );
      }
      case 'checklist_checked':
        return (
          <Pressable key={index} style={previewStyles.checklistItem}>
            <View style={[previewStyles.checkbox, previewStyles.checkboxChecked]}>
              <Text style={previewStyles.checkMark}>✓</Text>
            </View>
            <Text style={[previewStyles.listText, previewStyles.checkedText]}>
              {renderInlineFormatting(line.content)}
            </Text>
          </Pressable>
        );
      case 'checklist_unchecked':
        return (
          <Pressable key={index} style={previewStyles.checklistItem}>
            <View style={previewStyles.checkbox} />
            <Text style={previewStyles.listText}>
              {renderInlineFormatting(line.content)}
            </Text>
          </Pressable>
        );
      case 'divider':
        return (
          <View key={index} style={previewStyles.dividerContainer}>
            <View style={previewStyles.divider} />
          </View>
        );
      case 'code_start': {
        codeLineNum = 0;
        return (
          <View key={index} style={previewStyles.codeBlockHeader}>
            <View style={previewStyles.codeHeaderDots}>
              <View style={[previewStyles.codeDot, { backgroundColor: '#FF5F57' }]} />
              <View style={[previewStyles.codeDot, { backgroundColor: '#FEBC2E' }]} />
              <View style={[previewStyles.codeDot, { backgroundColor: '#28C840' }]} />
            </View>
            <Text style={previewStyles.codeLanguage}>{line.language || 'code'}</Text>
          </View>
        );
      }
      case 'code_line': {
        codeLineNum++;
        return (
          <View key={index} style={previewStyles.codeLineRow}>
            <Text style={previewStyles.codeLineNumber}>{codeLineNum}</Text>
            <Text style={previewStyles.codeLine}>{line.content}</Text>
          </View>
        );
      }
      case 'code_end':
        return <View key={index} style={previewStyles.codeBlockEnd} />;
      case 'table_header': {
        const cells = parseTableCells(line.content);
        return (
          <View key={index} style={previewStyles.tableContainer}>
            <View style={[previewStyles.tableRow, previewStyles.tableHeaderRow]}>
              {cells.map((cell, ci) => (
                <View key={ci} style={[previewStyles.tableCell, previewStyles.tableHeaderCell]}>
                  <Text style={previewStyles.tableHeaderText}>{cell}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      }
      case 'table_separator':
        return null;
      case 'table_row': {
        const cells = parseTableCells(line.content);
        return (
          <View key={index} style={previewStyles.tableContainer}>
            <View style={previewStyles.tableRow}>
              {cells.map((cell, ci) => (
                <View key={ci} style={previewStyles.tableCell}>
                  <Text style={previewStyles.tableCellText}>{cell}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      }
      case 'empty':
        return <View key={index} style={previewStyles.emptyLine} />;
      default:
        return (
          <Text key={index} style={previewStyles.paragraph}>
            {renderInlineFormatting(line.content)}
          </Text>
        );
    }
  };

  return (
    <ScrollView
      style={[previewStyles.container, backgroundColor ? { backgroundColor } : undefined]}
      showsVerticalScrollIndicator={false}
    >
      <View style={previewStyles.content}>
        {parsed.map((line, i) => renderLine(line, i))}
      </View>
    </ScrollView>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  h1Container: {
    marginTop: 24,
    marginBottom: 12,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  h1Underline: {
    height: 3,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    width: 40,
  },
  h2Container: {
    marginTop: 20,
    marginBottom: 10,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  h2Underline: {
    height: 2,
    backgroundColor: '#FFA94D',
    borderRadius: 1,
    width: 30,
  },
  h3Container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  h3Accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#FFD43B',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paragraph: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700' as const,
  },
  italic: {
    fontStyle: 'italic' as const,
  },
  strikethrough: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textMuted,
  },
  inlineCode: {
    backgroundColor: 'rgba(169,220,118,0.12)',
    color: '#A9DC76',
    fontFamily: 'monospace' as const,
    fontSize: 13,
    borderRadius: 4,
    paddingHorizontal: 5,
  },
  link: {
    color: Colors.accent,
    textDecorationLine: 'underline' as const,
  },
  calloutBlock: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  calloutBorder: {
    display: 'none',
  },
  calloutText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    flex: 1,
  },
  quoteBlock: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingLeft: 4,
  },
  quoteBorder: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginRight: 12,
  },
  quoteText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic' as const,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 9,
  },
  numberedBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(79,124,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  numberedBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  listText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    flex: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkMark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700' as const,
  },
  checkedText: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textMuted,
  },
  dividerContainer: {
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  codeBlockHeader: {
    backgroundColor: '#1A1E2E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#2A3040',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeHeaderDots: {
    flexDirection: 'row',
    gap: 6,
  },
  codeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  codeLanguage: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#A9DC76',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  codeLineRow: {
    backgroundColor: '#141822',
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2A3040',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  codeLineNumber: {
    width: 28,
    fontSize: 11,
    fontFamily: 'monospace' as const,
    color: '#4A5068',
    textAlign: 'right' as const,
    marginRight: 12,
    lineHeight: 20,
  },
  codeLine: {
    fontSize: 13,
    fontFamily: 'monospace' as const,
    color: '#E1E4E8',
    lineHeight: 20,
    flex: 1,
  },
  codeBlockEnd: {
    backgroundColor: '#141822',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    height: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#2A3040',
  },
  tableContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  tableHeaderRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.cardBorder,
  },
  tableHeaderCell: {
    backgroundColor: 'rgba(79,124,255,0.08)',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tableCellText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyLine: {
    height: 8,
  },
});
