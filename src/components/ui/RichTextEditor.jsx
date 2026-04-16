"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Image as ImageIcon } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

const MenuBar = ({ editor, onImageUpload }) => {
  if (!editor) {
    return null;
  }

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file && onImageUpload) {
        const url = await onImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f5f5f5] border-b border-[var(--voz-border)] text-[#185886]">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors ${editor.isActive('bold') ? 'bg-white text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors ${editor.isActive('italic') ? 'bg-white text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors ${editor.isActive('strike') ? 'bg-white text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-[1px] h-4 bg-[var(--voz-border)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors ${editor.isActive('bulletList') ? 'bg-white text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors ${editor.isActive('orderedList') ? 'bg-white text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors ${editor.isActive('blockquote') ? 'bg-white text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Quote"
      >
        <Quote size={16} />
      </button>

      <div className="w-[1px] h-4 bg-[var(--voz-border)] mx-1" />

      <button
        type="button"
        onClick={handleImageClick}
        className="p-1.5 rounded hover:bg-white hover:text-[var(--voz-text)] transition-colors"
        title="Upload Image"
      >
        <ImageIcon size={16} />
      </button>
    </div>
  );
};

export const RichTextEditor = forwardRef(({ content, onChange, onImageUpload, placeholder = 'Viết bình luận...' }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm xl:prose-base focus:outline-none min-h-[120px] max-h-[400px] overflow-y-auto p-3 text-[14px] w-full',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    setContent: (html) => editor?.commands.setContent(html),
    focus: () => editor?.commands.focus(),
  }));

  return (
    <div className="border border-[var(--voz-border)] rounded-[2px] bg-white flex flex-col focus-within:border-[var(--voz-link)] transition-colors w-full">
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <div className="flex-1 cursor-text bg-white" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
