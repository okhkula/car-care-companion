import { SendHorizontal, ImagePlus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPreviews: { file: File; url: string }[] = [];
    for (let i = 0; i < Math.min(files.length, 4 - previews.length); i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 10 * 1024 * 1024) continue;
      newPreviews.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 4));
  };

  const removePreview = (idx: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if ((!trimmed && previews.length === 0) || disabled) return;

    // Convert images to base64 data URLs for the AI
    const imageUrls: string[] = [];
    for (const p of previews) {
      const base64 = await fileToBase64(p.file);
      imageUrls.push(base64);
    }

    onSend(trimmed || "What's in this image?", imageUrls.length > 0 ? imageUrls : undefined);
    setValue("");
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      {previews.length > 0 && (
        <div className="flex gap-2 mb-2 max-w-3xl mx-auto">
          {previews.map((p, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePreview(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-foreground/70 text-background flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || previews.length >= 4}
          className="flex-shrink-0 w-10 h-10 rounded-xl border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <ImagePlus className="w-4 h-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about cars, driving, maintenance..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && previews.length === 0)}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default ChatInput;
