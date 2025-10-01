"use client";

import { ToolHeader } from "@/components/crypto/shared/tool-header";
import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Base64Crypto } from "@/lib/crypto/base64";
import { useCryptoDebounce } from "@/hooks/use-debounce";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";

export function Base64Tool() {
  const t = useTranslations();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isEncoding, setIsEncoding] = useState(true);
  const [enableRealTime, setEnableRealTime] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  // Real-time Base64 processing with debounce
  const base64Operation = useCallback(
    async (inputText: string) => {
      if (!inputText.trim()) return "";

      if (isEncoding) {
        return Base64Crypto.encode(inputText);
      } else {
        return Base64Crypto.decode(inputText);
      }
    },
    [isEncoding]
  );

  const {
    result: realtimeResult,
    isProcessing,
    error: realtimeError,
    trigger: triggerManual,
    clear: clearResults,
  } = useCryptoDebounce(input, base64Operation, {
    enableRealTime,
    delay: 300,
    minInputLength: 1,
    skipEmpty: true,
  });

  const handleEncode = useCallback(() => {
    try {
      if (!input.trim()) {
        toast.error(t("base64.errors.inputRequired"));
        return;
      }

      const result = Base64Crypto.encode(input);
      setOutput(result);
      toast.success(t("base64.actions.encoded"));
    } catch (error) {
      toast.error(
        `${t("base64.errors.encodingFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [input, t]);

  const handleDecode = useCallback(() => {
    try {
      if (!input.trim()) {
        toast.error(t("base64.errors.base64Required"));
        return;
      }

      const result = Base64Crypto.decode(input);
      setOutput(result);
      toast.success(t("base64.actions.decoded"));
    } catch (error) {
      toast.error(
        `${t("base64.errors.decodingFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [input, t]);

  const handleFileChange = useCallback(
    async (selectedFile: File | null) => {
      setFile(selectedFile);
      if (!selectedFile) {
        setOutput("");
        return;
      }

      try {
        const base64 = await Base64Crypto.fileToBase64(selectedFile);
        setOutput(`data:${selectedFile.type};base64,${base64}`);
        toast.success(`${t("base64.actions.fileConverted")} (${selectedFile.name})`);
      } catch (error) {
        toast.error(
          `${t("base64.errors.fileConversionFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
        );
      }
    },
    [t],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success(t("messages.copied"));
    } catch (error) {
      toast.error(t("errors.copyFailed"));
    }
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    clearResults();
  }, [clearResults]);

  const handleDownload = useCallback(() => {
    try {
      if (!output) {
        toast.error(t("base64.errors.noContent"));
        return;
      }

      const blob = new Blob([output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isEncoding ? "base64-encoded.txt" : "base64-decoded.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("base64.actions.downloaded"));
    } catch (error) {
      toast.error(t("base64.errors.downloadFailed"));
    }
  }, [output, isEncoding, t]);

  useEffect(() => {
    if (realtimeError) {
      toast.error(realtimeError);
    }
  }, [realtimeError]);

  return (
    <div className="flex flex-col space-y-4">
      <ToolHeader
        title={t("base64.title")}
        description={t("base64.description")}
      />

      <CardContent className="space-y-4">
        {/* 모드 선택 */}
        <div className="flex gap-2">
          <Button
            variant={isEncoding ? "default" : "outline"}
            onClick={() => setIsEncoding(true)}
          >
            {t("common.encode")}
          </Button>
          <Button
            variant={!isEncoding ? "default" : "outline"}
            onClick={() => setIsEncoding(false)}
          >
            {t("common.decode")}
          </Button>
        </div>

        {/* 파일 업로드 (인코딩 모드에서만) */}
        {isEncoding && (
          <FileUpload
            value={file}
            onChange={handleFileChange}
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

        {/* 텍스트 입력 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("common.input")}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isEncoding
                ? t("base64.placeholders.encode")
                : t("base64.placeholders.decode")
            }
            className="min-h-[120px] font-mono"
          />
        </div>

        {/* 실행 버튼 */}
        <div className="flex gap-2">
          <Button
            onClick={isEncoding ? handleEncode : handleDecode}
            disabled={!input.trim()}
          >
            {isEncoding ? t("common.encode") : t("common.decode")}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            {t("common.clear")}
          </Button>
        </div>

        {/* 실시간 처리 토글 */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="real-time"
            checked={enableRealTime}
            onChange={(e) => setEnableRealTime(e.target.checked)}
          />
          <label htmlFor="real-time" className="text-sm font-medium">
            {t("common.realTimeProcessing") || "Real-time Processing"}
          </label>
          {isProcessing && (
            <div className="text-xs text-muted-foreground">{t("common.processing")}</div>
          )}
        </div>

        {/* 결과 출력 */}
        {(realtimeResult || output) && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("base64.result")}</label>
            <Textarea
              value={enableRealTime ? (realtimeResult || "") : output}
              readOnly
              className={`min-h-[120px] font-mono border ${
                enableRealTime
                  ? "border-border/80 bg-muted/60"
                  : "border-border/60 bg-card/60"
              }`}
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const textToCopy = enableRealTime ? (realtimeResult || "") : output;
                  navigator.clipboard.writeText(textToCopy);
                  toast.success(t("messages.copied"));
                }}
              >
                {t("common.copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const textToDownload = enableRealTime ? (realtimeResult || "") : output;
                  const blob = new Blob([textToDownload], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = isEncoding ? "base64-encoded.txt" : "base64-decoded.txt";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(t("base64.actions.downloaded"));
                }}
              >
                {t("common.download")}
              </Button>
              {enableRealTime && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResults}
                >
                  {t("common.clear")}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}