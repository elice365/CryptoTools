"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  translations: {
    dragText: string;
    dragDescription: string;
    fileSelected: string;
    largeFile: string;
    normalFile: string;
    selectFile: string;
    changeFile: string;
    removeFile: string;
  };
}

export function FileUpload({
  value,
  onChange,
  accept,
  maxSize,
  disabled = false,
  className,
  translations,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!value && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [value]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (maxSize && file.size > maxSize) {
          return;
        }
        onChange(file);
      }
    },
    [disabled, maxSize, onChange]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    },
    []
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (maxSize && file.size > maxSize) {
          return;
        }
        onChange(file);
      }
    },
    [maxSize, onChange]
  );

  const handleRemoveFile = useCallback(() => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group",
          dragActive && !disabled && "border-primary bg-primary/5 scale-[1.02]",
          value && !disabled && "border-border bg-muted/60",
          !value && !dragActive && !disabled && "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-accent/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
          accept={accept}
          disabled={disabled}
        />

        {value ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="mt-1 rounded-lg bg-muted/60 p-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-sm truncate">{value.name}</p>
                    <Check className="flex-shrink-0 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(value.size)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={value.size > 1024 * 1024 ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      {value.size > 1024 * 1024
                        ? translations.largeFile
                        : translations.normalFile}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled}
            >
              {translations.changeFile}
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-foreground">
                {translations.dragText}
              </p>
              <p className="text-sm text-muted-foreground">
                {translations.dragDescription}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled}
            >
              {translations.selectFile}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
