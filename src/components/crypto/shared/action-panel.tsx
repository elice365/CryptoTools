import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { useTranslations } from "next-intl";
import { ChangeEvent, ReactNode } from "react";

interface ActionPanelProps {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onEncode?: () => void;
  onDecode?: () => void;
  onClear: () => void;
  isEncoding: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  enableRealTime: boolean;
  onRealTimeToggle: (e: ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  children?: ReactNode;
}

export function ActionPanel({
  input,
  onInputChange,
  onEncode,
  onDecode,
  onClear,
  isEncoding,
  file,
  onFileChange,
  enableRealTime,
  onRealTimeToggle,
  isProcessing,
  children,
}: ActionPanelProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      {isEncoding && (
        <FileUpload
          value={file}
          onChange={onFileChange}
          accept="image/*,text/*,.txt,.json,.xml,.csv"
          maxSize={10 * 1024 * 1024} // 10MB
          translations={{
            dragText: t("files.dragText"),
            dragDescription: t("base64.imageUpload"),
            fileSelected: t("files.fileSelected"),
            largeFile: t("files.largeFile"),
            normalFile: t("files.normalFile"),
            selectFile: t("common.selectFile"),
            changeFile: t("common.changeFile"),
            removeFile: t("common.removeFile"),
          }}
        />
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("common.input")}</label>
        <Textarea
          value={input}
          onChange={onInputChange}
          placeholder={
            isEncoding
              ? t("base64.placeholders.encode")
              : t("base64.placeholders.decode")
          }
          className="min-h-[120px] font-mono"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={isEncoding ? onEncode : onDecode}
          disabled={!input.trim()}
        >
          {isEncoding ? t("common.encode") : t("common.decode")}
        </Button>
        <Button variant="outline" onClick={onClear}>
          {t("common.clear")}
        </Button>
        {children}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="real-time"
          checked={enableRealTime}
          onChange={onRealTimeToggle}
        />
        <label htmlFor="real-time" className="text-sm font-medium">
          {t("common.realTimeProcessing") || "Real-time Processing"}
        </label>
        {isProcessing && (
          <div className="text-xs text-muted-foreground">{t("common.processing")}</div>
        )}
      </div>
    </div>
  );
}
