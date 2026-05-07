"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Image as ImageIcon, Loader2, SmilePlus, Sticker } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState, useCallback, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from 'next-themes';

const STICKER_PACKS = [
  {
    id: "3d-emojis",
    name: "3D",
    icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Cat%20with%20Tears%20of%20Joy.png",
    stickers: [
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Frog.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Monkey%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Alien.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Exploding%20Head.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Partying%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pleading%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smirking%20Face.png",
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Angry%20Face.png"
    ]
  },
  {
    id: "ami",
    name: "Ami Bụng Bự",
    icon: "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/icons/ami-bung-bu-5.png",
    stickers: [
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45417.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45418.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45419.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45420.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45421.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45422.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45423.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45424.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45425.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/ami-bung-bu-5/45426.png"
    ]
  },
  {
    id: "quynh-aka",
    name: "Quỳnh Aka",
    icon: "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/icons/quynh-aka-nghi-le.png",
    stickers: [
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23021.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23022.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23023.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23024.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23025.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23026.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23027.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23028.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23029.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/quynh-aka-nghi-le/23030.png"
    ]
  },
  {
    id: "moca-cho-dien",
    name: "Chó Shiba",
    icon: "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/icons/moca-cho-dien.png",
    stickers: [
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45897.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45898.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45899.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45900.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45901.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45902.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45903.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45904.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45905.png",
      "https://cdn.jsdelivr.net/gh/naptestdev/zalo-stickers/data/images/moca-cho-dien/45906.png"
    ]
  }
];

const MenuBar = ({ editor, onUploadWithLoading, isUploading }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0].id);
  const { resolvedTheme } = useTheme();
  const emojiRef = useRef(null);
  const stickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (stickerRef.current && !stickerRef.current.contains(event.target)) {
        setShowStickerPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const onEmojiClick = (emojiData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
  };

  const onStickerClick = (url) => {
    editor.chain().focus().setImage({ src: url }).run();
    setShowStickerPicker(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-[var(--voz-accent)] border-b border-[var(--voz-border)] text-[var(--voz-text)] relative z-10">
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

      {/* Nút upload ảnh */}
      <label
        className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        title="Tải ảnh lên"
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={isUploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                alert('Ảnh quá lớn. Tối đa 10MB.');
                e.target.value = '';
                return;
              }
              await onUploadWithLoading(file);
            }
            e.target.value = '';
          }}
        />
      </label>

      {/* Emoji Button */}
      <div className="relative" ref={emojiRef}>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${showEmojiPicker ? 'bg-[var(--voz-surface)] shadow-sm' : ''}`}
          title="Biểu tượng cảm xúc"
        >
          <SmilePlus size={16} />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-1 shadow-2xl rounded-lg overflow-hidden border border-[var(--voz-border)] z-50">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
              searchDisabled={false}
              skinTonesDisabled={true}
              width={320}
              height={350}
            />
          </div>
        )}
      </div>

      {/* Sticker Button */}
      <div className="relative" ref={stickerRef}>
        <button
          type="button"
          onClick={() => setShowStickerPicker(!showStickerPicker)}
          className={`p-1.5 rounded hover:bg-[var(--voz-surface)] hover:text-[var(--voz-text)] transition-colors ${showStickerPicker ? 'bg-[var(--voz-surface)] shadow-sm' : ''}`}
          title="Nhãn dán Voz"
        >
          <Sticker size={16} />
        </button>
        {showStickerPicker && (
          <div className="absolute bottom-full left-0 mb-1 shadow-2xl bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-lg flex flex-col z-50 w-[300px] overflow-hidden">
            {/* Sticker Grid */}
            <div className="p-3 max-h-[220px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-4 gap-2">
                {STICKER_PACKS.find(p => p.id === activePackId)?.stickers.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onStickerClick(url)}
                    className="aspect-square bg-[var(--voz-accent)] rounded-md hover:ring-2 hover:ring-[#c84448] transition-all p-1 flex items-center justify-center overflow-hidden"
                  >
                    <img src={url} className="w-full h-full object-contain" alt="Sticker" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
            {/* Tab Bar */}
            <div className="bg-[var(--voz-accent)] border-t border-[var(--voz-border)] px-2 py-1.5 flex gap-2 overflow-x-auto custom-scrollbar items-center hide-scrollbar">
              {STICKER_PACKS.map(pack => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setActivePackId(pack.id)}
                  title={pack.name}
                  className={`p-1.5 rounded-md transition-all flex-shrink-0 opacity-60 hover:opacity-100 ${activePackId === pack.id ? 'bg-[var(--voz-surface)] opacity-100 shadow-sm border border-[var(--voz-border)]' : ''}`}
                >
                  <img src={pack.icon} alt={pack.name} className="w-6 h-6 object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
