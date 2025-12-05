"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { ListItemNode, ListNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { Bold, Italic, Underline, List as ListIcon, ListOrdered } from "lucide-react";

type Props = { placeholder?: string };

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
      <button type="button" className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Bold" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
        <Bold className="size-5" />
      </button>
      <button type="button" className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Italic" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
        <Italic className="size-5" />
      </button>
      <button type="button" className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Underline" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
        <Underline className="size-5" />
      </button>
      <button type="button" className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Bulleted list" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
        <ListIcon className="size-5" />
      </button>
      <button type="button" className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Numbered list" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
        <ListOrdered className="size-5" />
      </button>
    </div>
  );
}

export default function RichTextEditor({ placeholder = "Write your announcement here..." }: Props) {
  const initialConfig = {
    namespace: "AnnouncementEditor",
    theme: {},
    onError(error: unknown) {
      console.error(error);
    },
    nodes: [ListNode, ListItemNode],
  };

  return (
    <div className="rounded-lg border border-gray-200">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[150px] w-full p-3 text-gray-900 dark:text-white"
              aria-placeholder={placeholder}
              placeholder={<div className="p-3 text-gray-400">{placeholder}</div>}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
      </LexicalComposer>
    </div>
  );
}
