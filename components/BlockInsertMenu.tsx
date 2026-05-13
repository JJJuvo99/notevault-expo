import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  TextInput,
} from "react-native";
import {
  X,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Code2,
  Quote,
  Minus,
  Table2,
  AlertCircle,
  ToggleLeft,
  Image,
  Link,
  FileText,
  Hash,
  Braces,
  BarChart3,
  Columns,
  PaintBucket,
  ChevronRight,
  Search,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";

export interface BlockType {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  markdown: string;
}

const BLOCK_CATEGORIES = [
  { id: "basic", label: "Basic" },
  { id: "inline", label: "Inline" },
  { id: "media", label: "Media & Code" },
  { id: "advanced", label: "Advanced" },
];

function getBlocks(Colors: any): BlockType[] {
  return [
    {
      id: "text",
      label: "Text",
      description: "Plain text paragraph",
      category: "basic",
      icon: <Type size={18} color={Colors.textSecondary} />,
      markdown: "\n",
    },
    {
      id: "h1",
      label: "Heading 1",
      description: "Large section heading",
      category: "basic",
      icon: <Heading1 size={18} color="#FF6B6B" />,
      markdown: "\n# ",
    },
    {
      id: "h2",
      label: "Heading 2",
      description: "Medium section heading",
      category: "basic",
      icon: <Heading2 size={18} color="#FFA94D" />,
      markdown: "\n## ",
    },
    {
      id: "h3",
      label: "Heading 3",
      description: "Small section heading",
      category: "basic",
      icon: <Heading3 size={18} color="#FFD43B" />,
      markdown: "\n### ",
    },
    {
      id: "bullet",
      label: "Bullet List",
      description: "Unordered list item",
      category: "basic",
      icon: <List size={18} color={Colors.accent} />,
      markdown: "\n- ",
    },
    {
      id: "numbered",
      label: "Numbered List",
      description: "Ordered list item",
      category: "basic",
      icon: <ListOrdered size={18} color={Colors.accent} />,
      markdown: "\n1. ",
    },
    {
      id: "checklist",
      label: "Checklist",
      description: "To-do item with checkbox",
      category: "basic",
      icon: <ListChecks size={18} color={Colors.success} />,
      markdown: "\n- [ ] ",
    },
    {
      id: "toggle",
      label: "Toggle List",
      description: "Collapsible content block",
      category: "basic",
      icon: <ToggleLeft size={18} color="#845EF7" />,
      markdown:
        "\n<details>\n<summary>Toggle title</summary>\n\nContent here\n\n</details>\n",
    },
    {
      id: "quote",
      label: "Quote",
      description: "Blockquote for citations",
      category: "basic",
      icon: <Quote size={18} color="#66D9EF" />,
      markdown: "\n> ",
    },
    {
      id: "divider",
      label: "Divider",
      description: "Horizontal separator line",
      category: "basic",
      icon: <Minus size={18} color={Colors.textMuted} />,
      markdown: "\n---\n",
    },
    {
      id: "callout",
      label: "Callout",
      description: "Highlighted information box",
      category: "basic",
      icon: <AlertCircle size={18} color={Colors.warning} />,
      markdown: "\n> **Note:** ",
    },
    {
      id: "code_inline",
      label: "Inline Code",
      description: "Code within text",
      category: "inline",
      icon: <Hash size={18} color="#A9DC76" />,
      markdown: "`code`",
    },
    {
      id: "bold",
      label: "Bold",
      description: "Strong emphasis text",
      category: "inline",
      icon: <Type size={18} color="#FF6B6B" />,
      markdown: "**bold**",
    },
    {
      id: "italic",
      label: "Italic",
      description: "Emphasized text",
      category: "inline",
      icon: <Type size={18} color="#66D9EF" />,
      markdown: "_italic_",
    },
    {
      id: "strikethrough",
      label: "Strikethrough",
      description: "Crossed out text",
      category: "inline",
      icon: <Type size={18} color={Colors.textMuted} />,
      markdown: "~~text~~",
    },
    {
      id: "link",
      label: "Link",
      description: "Hyperlink to URL",
      category: "inline",
      icon: <Link size={18} color={Colors.accent} />,
      markdown: "[link text](url)",
    },
    {
      id: "code_block",
      label: "Code Block",
      description: "Multi-line code with language selection",
      category: "media",
      icon: <Code2 size={18} color="#A9DC76" />,
      markdown: "CODE_BLOCK",
    },
    {
      id: "table",
      label: "Table",
      description: "Structured data grid",
      category: "media",
      icon: <Table2 size={18} color="#845EF7" />,
      markdown: "TABLE",
    },
    {
      id: "image",
      label: "Image",
      description: "Embed an image by URL",
      category: "media",
      icon: <Image size={18} color="#FFA94D" />,
      markdown: "\n![alt text](image_url)\n",
    },
    {
      id: "math",
      label: "Math Equation",
      description: "LaTeX math expression",
      category: "advanced",
      icon: <Braces size={18} color="#FF6B6B" />,
      markdown: "\n$$\nE = mc^2\n$$\n",
    },
    {
      id: "chart_bar",
      label: "Bar Chart",
      description: "Markdown bar chart data",
      category: "advanced",
      icon: <BarChart3 size={18} color={Colors.accent} />,
      markdown:
        "\n```chart\ntype: bar\nlabels: [A, B, C, D]\ndata: [25, 50, 75, 100]\ntitle: Chart Title\n```\n",
    },
    {
      id: "columns",
      label: "Two Columns",
      description: "Side-by-side layout",
      category: "advanced",
      icon: <Columns size={18} color="#66D9EF" />,
      markdown:
        "\n| Column 1 | Column 2 |\n|----------|----------|\n| Content  | Content  |\n",
    },
    {
      id: "form_field",
      label: "Form Field",
      description: "Input field template",
      category: "advanced",
      icon: <FileText size={18} color={Colors.success} />,
      markdown: "\n**Label:** _______________\n",
    },
    {
      id: "color_block",
      label: "Colored Block",
      description: "Highlighted text block",
      category: "advanced",
      icon: <PaintBucket size={18} color="#FFA94D" />,
      markdown: "\n> **Highlighted Block**\n> Your content here\n",
    },
  ];
}

const CODE_LANGUAGES_GROUPED = [
  {
    label: "Popular",
    languages: [
      "javascript",
      "typescript",
      "python",
      "java",
      "html",
      "css",
      "sql",
      "bash",
      "json",
    ],
  },
  {
    label: "Systems",
    languages: ["c", "cpp", "csharp", "go", "rust", "swift", "kotlin"],
  },
  {
    label: "Scripting",
    languages: ["ruby", "php", "perl", "lua", "r", "dart"],
  },
  {
    label: "Functional",
    languages: ["haskell", "elixir", "clojure", "scala"],
  },
  {
    label: "Data",
    languages: ["yaml", "xml", "markdown", "graphql", "toml"],
  },
];

interface BlockInsertMenuProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

export default function BlockInsertMenu({
  visible,
  onClose,
  onInsert,
}: BlockInsertMenuProps) {
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);
  const BLOCKS = useMemo(() => getBlocks(Colors), [Colors]);
  const [activeCategory, setActiveCategory] = useState("basic");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showTableConfig, setShowTableConfig] = useState(false);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const [langSearch, setLangSearch] = useState("");
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setActiveCategory("basic");
      setShowLanguagePicker(false);
      setShowTableConfig(false);
      setLangSearch("");
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const filteredBlocks = searchQuery
    ? BLOCKS.filter(
        (b) =>
          b.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : BLOCKS.filter((b) => b.category === activeCategory);

  const filteredLangGroups = CODE_LANGUAGES_GROUPED.map((group) => ({
    ...group,
    languages: group.languages.filter((l) =>
      l.toLowerCase().includes(langSearch.toLowerCase()),
    ),
  })).filter((group) => group.languages.length > 0);

  const handleBlockPress = useCallback(
    (block: BlockType) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (block.id === "code_block") {
        setShowLanguagePicker(true);
        return;
      }
      if (block.id === "table") {
        setShowTableConfig(true);
        return;
      }

      onInsert(block.markdown);
      onClose();
    },
    [onInsert, onClose],
  );

  const handleLanguageSelect = useCallback(
    (lang: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onInsert(`\n\`\`\`${lang}\n\n\`\`\`\n`);
      setShowLanguagePicker(false);
      onClose();
    },
    [onInsert, onClose],
  );

  const handleTableInsert = useCallback(() => {
    const rows = Math.max(1, Math.min(20, parseInt(tableRows, 10) || 3));
    const cols = Math.max(1, Math.min(10, parseInt(tableCols, 10) || 3));

    const header =
      "| " +
      Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(" | ") +
      " |";
    const separator =
      "| " + Array.from({ length: cols }, () => "---").join(" | ") + " |";
    const dataRows = Array.from(
      { length: rows },
      () => "| " + Array.from({ length: cols }, () => "   ").join(" | ") + " |",
    ).join("\n");

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onInsert(`\n${header}\n${separator}\n${dataRows}\n`);
    setShowTableConfig(false);
    onClose();
  }, [tableRows, tableCols, onInsert, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {showLanguagePicker
                  ? "Code Language"
                  : showTableConfig
                    ? "Table Size"
                    : "Insert Block"}
              </Text>
              {showLanguagePicker && (
                <Pressable
                  onPress={() => setShowLanguagePicker(false)}
                  style={styles.backBtn}
                >
                  <Text style={styles.backBtnText}>Back</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {showLanguagePicker ? (
              <View style={styles.languagePickerContainer}>
                <View style={styles.langSearchRow}>
                  <Search size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.langSearchInput}
                    placeholder="Search languages..."
                    placeholderTextColor={Colors.textMuted}
                    value={langSearch}
                    onChangeText={setLangSearch}
                    autoFocus
                  />
                </View>
                <ScrollView
                  style={styles.languageList}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredLangGroups.map((group) => (
                    <View key={group.label} style={styles.langGroup}>
                      <Text style={styles.langGroupTitle}>{group.label}</Text>
                      <View style={styles.langGroupGrid}>
                        {group.languages.map((lang) => (
                          <Pressable
                            key={lang}
                            style={({ pressed }) => [
                              styles.languageChip,
                              pressed && styles.languageChipPressed,
                            ]}
                            onPress={() => handleLanguageSelect(lang)}
                          >
                            <Code2 size={13} color="#A9DC76" />
                            <Text style={styles.languageChipText}>{lang}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : showTableConfig ? (
              <View style={styles.tableConfig}>
                <View style={styles.tableConfigRow}>
                  <Text style={styles.tableConfigLabel}>Rows</Text>
                  <View style={styles.tableStepperRow}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => {
                        const v = Math.max(
                          1,
                          (parseInt(tableRows, 10) || 3) - 1,
                        );
                        setTableRows(String(v));
                        void Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      style={styles.tableConfigInput}
                      value={tableRows}
                      onChangeText={setTableRows}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => {
                        const v = Math.min(
                          20,
                          (parseInt(tableRows, 10) || 3) + 1,
                        );
                        setTableRows(String(v));
                        void Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.tableConfigRow}>
                  <Text style={styles.tableConfigLabel}>Columns</Text>
                  <View style={styles.tableStepperRow}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => {
                        const v = Math.max(
                          1,
                          (parseInt(tableCols, 10) || 3) - 1,
                        );
                        setTableCols(String(v));
                        void Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      style={styles.tableConfigInput}
                      value={tableCols}
                      onChangeText={setTableCols}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => {
                        const v = Math.min(
                          10,
                          (parseInt(tableCols, 10) || 3) + 1,
                        );
                        setTableCols(String(v));
                        void Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.tablePreview}>
                  <Text style={styles.tablePreviewLabel}>
                    {parseInt(tableRows, 10) || 3} ×{" "}
                    {parseInt(tableCols, 10) || 3} table
                  </Text>
                </View>
                <Pressable
                  style={styles.tableInsertBtn}
                  onPress={handleTableInsert}
                >
                  <Text style={styles.tableInsertBtnText}>Insert Table</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.searchRow}>
                  <View style={styles.searchInputWrap}>
                    <Search size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search blocks..."
                      placeholderTextColor={Colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>

                {!searchQuery && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                  >
                    {BLOCK_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          activeCategory === cat.id &&
                            styles.categoryChipActive,
                        ]}
                        onPress={() => {
                          setActiveCategory(cat.id);
                          void Haptics.selectionAsync();
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            activeCategory === cat.id &&
                              styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                <ScrollView
                  style={styles.blockList}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredBlocks.map((block) => (
                    <Pressable
                      key={block.id}
                      style={({ pressed }) => [
                        styles.blockItem,
                        pressed && styles.blockItemPressed,
                      ]}
                      onPress={() => handleBlockPress(block)}
                    >
                      <View style={styles.blockIcon}>{block.icon}</View>
                      <View style={styles.blockInfo}>
                        <Text style={styles.blockLabel}>{block.label}</Text>
                        <Text style={styles.blockDesc}>
                          {block.description}
                        </Text>
                      </View>
                      {(block.id === "code_block" || block.id === "table") && (
                        <ChevronRight size={16} color={Colors.textMuted} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
      paddingBottom: 30,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.cardBorder,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 6,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: Colors.text,
      flex: 1,
    },
    backBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: Colors.accentSoft,
      marginRight: 8,
    },
    backBtnText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: Colors.accent,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    searchRow: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    searchInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      color: Colors.text,
      fontSize: 14,
    },
    categoryRow: {
      paddingHorizontal: 20,
      gap: 8,
      paddingBottom: 12,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 42,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    categoryChipActive: {
      backgroundColor: Colors.accentSoft,
      borderColor: Colors.accent,
    },
    categoryChipText: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "600" as const,
      textAlignVertical: "center",
      color: Colors.textSecondary,
    },
    categoryChipTextActive: {
      color: Colors.accent,
    },
    blockList: {
      paddingHorizontal: 16,
    },
    blockItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 14,
    },
    blockItemPressed: {
      backgroundColor: Colors.card,
    },
    blockIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: Colors.card,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    blockInfo: {
      flex: 1,
    },
    blockLabel: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: Colors.text,
      marginBottom: 2,
    },
    blockDesc: {
      fontSize: 12,
      color: Colors.textMuted,
    },
    languagePickerContainer: {
      maxHeight: 400,
    },
    langSearchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: Colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
      gap: 8,
    },
    langSearchInput: {
      flex: 1,
      paddingVertical: 10,
      color: Colors.text,
      fontSize: 14,
    },
    languageList: {
      paddingHorizontal: 20,
    },
    langGroup: {
      marginBottom: 16,
    },
    langGroupTitle: {
      fontSize: 11,
      fontWeight: "700" as const,
      color: Colors.textMuted,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    langGroupGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    languageChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    languageChipPressed: {
      backgroundColor: Colors.accentSoft,
      borderColor: "#A9DC76",
    },
    languageChipText: {
      fontSize: 13,
      color: Colors.text,
      fontWeight: "500" as const,
    },
    tableConfig: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 16,
    },
    tableConfigRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tableConfigLabel: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: Colors.text,
    },
    tableStepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    stepperBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    stepperBtnText: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: Colors.accent,
    },
    tableConfigInput: {
      width: 50,
      backgroundColor: Colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: Colors.text,
      fontSize: 16,
      textAlign: "center" as const,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
      fontWeight: "600" as const,
    },
    tablePreview: {
      alignItems: "center",
      paddingVertical: 8,
    },
    tablePreviewLabel: {
      fontSize: 13,
      color: Colors.textMuted,
      fontWeight: "500" as const,
    },
    tableInsertBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    tableInsertBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700" as const,
    },
  });
