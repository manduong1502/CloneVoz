"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Image as ImageIcon, Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';

const MenuBar = ({ editor, onUploadWithLoading, isUploading }) => {
  if (!editor) {
    return null;
  }

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await onUploadWithLoading(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-[var(--voz-accent)] border-b border-[var(--voz-border)] text-[#185886]">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${editor.isActive('bold') ? 'bg-[var(--voz-surface)] text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${editor.isActive('italic') ? 'bg-[var(--voz-surface)] text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${editor.isActive('strike') ? 'bg-[var(--voz-surface)] text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-[1px] h-4 bg-[var(--voz-border)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${editor.isActive('bulletList') ? 'bg-[var(--voz-surface)] text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${editor.isActive('orderedList') ? 'bg-[var(--voz-surface)] text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${editor.isActive('blockquote') ? 'bg-[var(--voz-surface)] text-[var(--voz-text)] shadow-sm' : ''}`}
        title="Quote"
      >
        <Quote size={16} />
      </button>

      <div className="w-[1px] h-4 bg-[var(--voz-border)] mx-1" />

      <button
        type="button"
        onClick={handleImageClick}
        disabled={isUploading}
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Tải ảnh lên"
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
      </button>
    </div>
  );
};

export const RichTextEditor = forwardRef(({ content, onChange, onImageUpload, placeholder = 'Viết bình luận...' }, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  // Wrapper function that handles loading state
  const uploadWithLoading = useCallback(async (file) => {
    if (!onImageUpload) return null;
    setIsUploading(true);
    setUploadCount(c => c + 1);
    try {
      const url = await onImageUpload(file);
      if (url && editor) {
        try {
          editor.chain().focus().setImage({ src: url }).run();
        } catch (err) {
          console.error('Image insert error:', err);
        }
      }
      return url;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploadCount(c => {
        const newCount = c - 1;
        if (newCount <= 0) setIsUploading(false);
        return newCount;
      });
    }
  }, [onImageUpload]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        blockquote: {
          HTMLAttributes: {
            contenteditable: 'false',
          },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false, // TUYỆT ĐỐI CẤM BASE64 ĐỂ BẢO VỆ DATABASE!
        HTMLAttributes: {
          class: 'post-image',
        },
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
      // Chặn gõ phím khi cursor nằm trong blockquote
      handleKeyDown: (view, event) => {
        const { $from } = view.state.selection;
        // Kiểm tra xem cursor có nằm bên trong blockquote không
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'blockquote') {
            // Cho phép Backspace/Delete để xóa cả blockquote
            if (event.key === 'Backspace' || event.key === 'Delete') {
              return false; // để TipTap xử lý bình thường
            }
            // Chặn mọi phím khác (gõ chữ, Enter, etc.)
            // Di chuyển cursor ra sau blockquote
            const endOfBlockquote = $from.end(d);
            const resolvedPos = view.state.doc.resolve(endOfBlockquote + 1);
            view.dispatch(view.state.tr.setSelection(
              view.state.selection.constructor.near(resolvedPos)
            ));
            return false; // cho TipTap tiếp tục xử lý ở vị trí mới
          }
        }
        return false;
      },
      // Khi click vào blockquote, chuyển cursor ra sau nó
      handleClick: (view, pos, event) => {
        const $pos = view.state.doc.resolve(pos);
        for (let d = $pos.depth; d > 0; d--) {
          if ($pos.node(d).type.name === 'blockquote') {
            const endOfBlockquote = $pos.end(d);
            try {
              const resolvedPos = view.state.doc.resolve(Math.min(endOfBlockquote + 1, view.state.doc.content.size));
              view.dispatch(view.state.tr.setSelection(
                view.state.selection.constructor.near(resolvedPos)
              ));
            } catch {}
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (file && onImageUpload) {
              setIsUploading(true);
              setUploadCount(c => c + 1);
              onImageUpload(file).then(url => {
                if (url) {
                  try {
                    editor.chain().focus().setImage({ src: url }).run();
                  } catch (err) {
                    console.error('Paste image error:', err);
                  }
                }
              }).finally(() => {
                setUploadCount(c => {
                  const newCount = c - 1;
                  if (newCount <= 0) setIsUploading(false);
                  return newCount;
                });
              });
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.indexOf('image') === 0 && onImageUpload) {
            setIsUploading(true);
            setUploadCount(c => c + 1);
            onImageUpload(file).then(url => {
              if (url) {
                try {
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  if (coordinates) {
                    editor.chain().focus().insertContentAt(coordinates.pos, { type: 'image', attrs: { src: url } }).run();
                  } else {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                } catch (err) {
                  console.error('Drop image error:', err);
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }
            }).finally(() => {
              setUploadCount(c => {
                const newCount = c - 1;
                if (newCount <= 0) setIsUploading(false);
                return newCount;
              });
            });
            return true;
          }
        }
        return false;
      }
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
    <div className="border border-[var(--voz-border)] rounded-[2px] bg-[var(--voz-surface)] flex flex-col focus-within:border-[var(--voz-link)] transition-colors w-full relative">
      <MenuBar editor={editor} onUploadWithLoading={uploadWithLoading} isUploading={isUploading} />
      <div className="flex-1 cursor-text bg-[var(--voz-surface)] relative" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
        
        {/* Upload Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-b-[2px]">
            <div className="flex items-center gap-2 bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-lg px-4 py-2.5 shadow-lg">
              <Loader2 size={18} className="animate-spin text-[#f2930d]" />
              <span className="text-[13px] font-medium text-[var(--voz-text)]">Đang tải ảnh lên...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
