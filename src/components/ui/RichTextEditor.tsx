"use client";

import { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { ListItemNode, ListNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { Bold, Italic, Underline, List as ListIcon, ListOrdered } from "lucide-react";

type Props = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  namespace?: string;
  disabled?: boolean;
};

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Bold"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        disabled={disabled}
      >
        <Bold className="size-5" />
      </button>
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Italic"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        disabled={disabled}
      >
        <Italic className="size-5" />
      </button>
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Underline"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        disabled={disabled}
      >
        <Underline className="size-5" />
      </button>
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Bulleted list"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        disabled={disabled}
      >
        <ListIcon className="size-5" />
      </button>
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Numbered list"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        disabled={disabled}
      >
        <ListOrdered className="size-5" />
      </button>
    </div>
  );
}

function UpdatePlugin({ value, onChange, initialValue }: { value?: string; onChange?: (value: string) => void; initialValue?: string }) {
  const [editor] = useLexicalComposerContext();
  const isInitialMount = useRef(true);
  const lastValueRef = useRef<string | undefined>(value ?? initialValue);
  const isUpdatingFromProp = useRef(false);

  // Set initial value on mount
  useEffect(() => {
    if (isInitialMount.current && (initialValue || value)) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const textToSet = value ?? initialValue ?? "";
        if (textToSet) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(textToSet));
          root.append(paragraph);
        }
      });
      isInitialMount.current = false;
    }
  }, [editor, initialValue, value]);

  // Update editor when value prop changes externally
  useEffect(() => {
    if (!isInitialMount.current && value !== undefined && value !== lastValueRef.current) {
      isUpdatingFromProp.current = true;
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        if (value) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(value));
          root.append(paragraph);
        }
        lastValueRef.current = value;
      });
      isUpdatingFromProp.current = false;
    }
  }, [value, editor]);

  // Handle changes from editor
  const handleChange = (editorState: any) => {
    if (isUpdatingFromProp.current) return;
    
    editorState.read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      if (text !== lastValueRef.current) {
        lastValueRef.current = text;
        onChange?.(text);
      }
    });
  };

  return <OnChangePlugin onChange={handleChange} />;
}

export default function RichTextEditor({
  placeholder = "Write your announcement here...",
  value,
  onChange,
  namespace = "RichTextEditor",
  disabled = false,
}: Props) {
  const initialConfig = {
    namespace,
    theme: {},
    onError(error: unknown) {
      console.error(error);
    },
    nodes: [ListNode, ListItemNode],
  };

  const placeholderElement = (
    <div className="absolute top-3 left-3 text-gray-400 dark:text-gray-500 pointer-events-none select-none">
      {placeholder}
    </div>
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar disabled={disabled} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`min-h-[150px] w-full p-3 text-gray-900 dark:text-gray-100 focus:outline-none ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-placeholder={placeholder}
                placeholder={placeholderElement}
                contentEditable={!disabled}
              />
            }
            placeholder={placeholderElement}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <UpdatePlugin value={value} onChange={onChange} initialValue={value} />
        <HistoryPlugin />
        <ListPlugin />
      </LexicalComposer>
    </div>
  );
}
