"use client";

import { useCallback, useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { isRichTextEmpty } from "@/shared/libs/richText";

interface RichTextEditorProps {
  /** Current HTML value (RHF-controlled). */
  value: string;
  /** Receives the new HTML — empty string when the document has no text. */
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
}

/**
 * The job-description editor: Tiptap with a deliberately small surface —
 * bold/italic, two heading levels, lists, links, undo/redo. Emits HTML; the
 * value is sanitized again at save and render (shared/libs/richText), so the
 * editor is a convenience, not a security boundary.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Describe the role, the team, and what a great candidate looks like…",
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    // Next.js SSR: render only after hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: id ?? "",
        class:
          "prose prose-sm max-w-none min-h-[180px] px-3.5 py-3 focus:outline-none " +
          "prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground " +
          "prose-a:text-primary prose-li:text-foreground",
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      onChange(isRichTextEmpty(html) ? "" : html);
    },
  });

  // Adopt external resets (e.g. RHF `reset` after loading a job) without
  // clobbering the caret during normal typing.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    // A prompt keeps the toolbar dependency-free; the URL is validated by
    // the sanitizer's protocol allow-list anyway.
    const url = window.prompt("Link URL");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[230px] animate-pulse rounded-lg border border-input bg-muted/50" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background shadow-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/60 px-2 py-1.5"
      >
        <ToolbarButton
          icon={Bold}
          label="Bold"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Divider />
        <ToolbarButton
          icon={Heading2}
          label="Heading"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarButton
          icon={Heading3}
          label="Subheading"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <Divider />
        <ToolbarButton
          icon={List}
          label="Bullet list"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Divider />
        <ToolbarButton
          icon={editor.isActive("link") ? Link2Off : Link2}
          label={editor.isActive("link") ? "Remove link" : "Add link"}
          isActive={editor.isActive("link")}
          onClick={toggleLink}
        />
        <Divider />
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-primary disabled:pointer-events-none disabled:opacity-40",
        isActive && "bg-accent text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;
}

export type { Editor };
