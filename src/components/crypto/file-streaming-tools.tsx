"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { CryptoHelper } from "./crypto-helper";

// Basic crypto imports
import {
  hashString,
  hashFile,
  generateAesKey,
  exportAesKey,
  encryptSymmetric,
  decryptSymmetric,
  stringToBase64,
  base64ToString
} from "@/lib/crypto";

type FileOperation = "encrypt" | "decrypt" | "hash";
type Algorithm = "AES-GCM" | "SHA-256" | "SHA-512";

interface FileProcessingState {
  file: File | null;
  operation: FileOperation;
  algorithm: Algorithm;
  key: string | null;
  isProcessing: boolean;
  progress: number;
  result: string | null;
}

export function FileStreamingTools() {
  const t = useTranslations();
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const [state, setState] = useState<FileProcessingState>({
    file: null,
    operation: "encrypt",
    algorithm: "AES-GCM",
    key: null,
    isProcessing: false,
    progress: 0,
    result: null,
  });

  const [cryptoError, setCryptoError] = useState<string | null>(null);

  const updateState = useCallback((updates: Partial<FileProcessingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    updateState({ file, result: null, progress: 0 });
    if (file) {
      toast.success(`${t("files.fileSelected")}: ${file.name}`);
    }
  }, [updateState, t]);

  const generateCryptoKeys = async () => {
    if (!state.algorithm.startsWith('AES')) return;

    try {
      // Debug Web Crypto API availability
      console.log('Browser environment check:', typeof window !== 'undefined');
      console.log('window.crypto exists:', typeof window !== 'undefined' && !!window.crypto);
      console.log('window.crypto.subtle exists:', typeof window !== 'undefined' && !!window.crypto?.subtle);
      console.log('Location protocol:', typeof window !== 'undefined' ? window.location?.protocol : 'N/A');

      // Check if we're in browser environment first
      if (typeof window === 'undefined') {
        throw new Error(t("files.errors.browserOnly"));
      }

      // Check if crypto.subtle is available
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error(t("files.errors.cryptoNotSupported"));
      }

      // Generate AES key and export it as base64
      const cryptoKey = await generateAesKey(256);
      const keyString = await exportAesKey(cryptoKey, "base64");

      updateState({ key: keyString });
      toast.success(t("files.actions.keyGenerated"));
    } catch (error) {
      console.error("Crypto key generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCryptoError(errorMessage);
      toast.error(`${t("errors.keyGenerationFailed")}: ${errorMessage}`);
    }
  };

  const processFile = async () => {
    if (!state.file) {
      toast.error(t("files.errors.selectFile"));
      return;
    }

    if ((state.operation === "encrypt" || state.operation === "decrypt") && !state.key) {
      toast.error(t("files.errors.generateKeyFirst"));
      return;
    }

    updateState({ isProcessing: true, progress: 0, result: null });

    try {
      let result: string;

      if (state.operation === "hash") {
        // Hash file
        updateState({ progress: 25 });
        result = await hashFile(state.file, state.algorithm.toLowerCase(), "hex");
        updateState({ progress: 100 });
      } else {
        // Encrypt/Decrypt file
        updateState({ progress: 25 });

        const fileText = await fileToText(state.file);
        updateState({ progress: 50 });

        if (state.operation === "encrypt") {
          const encryptResult = await encryptSymmetric(fileText, { key: state.key });
          result = `${encryptResult.cipherText}:${encryptResult.nonce}`;
        } else {
          // Decrypt
          const [cipherText, nonce] = state.file.name.includes('.encrypted')
            ? fileText.split(':')
            : [fileText, ''];

          if (!nonce) {
            throw new Error(t("files.errors.nonceNotFound"));
          }

          result = await decryptSymmetric({ cipherText, nonce }, { key: state.key });
        }
        updateState({ progress: 100 });
      }

      updateState({ result });
      const actionKey = state.operation === "encrypt" ? "files.actions.encrypted" :
                       state.operation === "decrypt" ? "files.actions.decrypted" :
                       "files.actions.hashed";
      toast.success(t(actionKey));

      // Trigger download
      setTimeout(() => triggerDownload(result), 100);

    } catch (error) {
      toast.error(`${t("errors.encryptionFailed")}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      updateState({ isProcessing: false, progress: 0 });
    }
  };

  const fileToText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error(t("files.errors.fileReadFailed")));
      reader.readAsText(file);
    });
  };

  const triggerDownload = (data: string) => {
    if (!state.file) return;

    let filename: string;
    let content: string;
    let mimeType: string;

    switch (state.operation) {
      case "encrypt":
        filename = `${state.file.name}.encrypted`;
        content = data;
        mimeType = 'text/plain';
        break;
      case "decrypt":
        filename = state.file.name.replace('.encrypted', '');
        content = data;
        mimeType = 'text/plain';
        break;
      case "hash":
        filename = `${state.file.name}.${state.algorithm.toLowerCase().replace('-', '')}.hash`;
        content = data;
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = downloadLinkRef.current;
    if (link) {
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearFile = () => {
    updateState({
      file: null,
      result: null,
      progress: 0,
      key: null
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("files.cardTitle")}</CardTitle>
        <CardDescription>
          {t("files.cardDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Crypto Helper for security context issues */}
        {cryptoError && (
          <CryptoHelper
            error={cryptoError}
            onRetry={() => {
              setCryptoError(null);
              generateCryptoKeys();
            }}
          />
        )}
        {/* File Upload Area */}
        <FileUpload
          value={state.file}
          onChange={handleFileChange}
          accept=".txt,.md,.json,.xml,.csv,.log,text/*"
          maxSize={50 * 1024 * 1024} // 50MB
          translations={{
            dragText: t("files.dragText"),
            dragDescription: t("files.dragDescription"),
            fileSelected: t("files.fileSelected"),
            largeFile: t("files.largeFile"),
            normalFile: t("files.normalFile"),
            selectFile: t("common.selectFile"),
            changeFile: t("common.changeFile"),
            removeFile: t("common.removeFile"),
          }}
        />

        {/* Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("files.operation")}</Label>
            <Select
              value={state.operation}
              onValueChange={(value: FileOperation) => updateState({ operation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="encrypt">{t("files.operations.encrypt")}</SelectItem>
                <SelectItem value="decrypt">{t("files.operations.decrypt")}</SelectItem>
                <SelectItem value="hash">{t("files.operations.hash")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("files.algorithm")}</Label>
            <Select
              value={state.algorithm}
              onValueChange={(value: Algorithm) => updateState({ algorithm: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.operation === "hash" ? (
                  <>
                    <SelectItem value="SHA-256">SHA-256</SelectItem>
                    <SelectItem value="SHA-512">SHA-512</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="AES-GCM">AES-GCM</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Generation */}
        {(state.operation === "encrypt" || state.operation === "decrypt") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("files.encryptionKey")}</Label>
              <Button variant="outline" onClick={generateCryptoKeys}>
                {t("files.generateKey")}
              </Button>
            </div>
            {state.key && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  ✅ {t("files.keySuccess")}
                  <br />
                  {t("files.algorithm")}: {state.algorithm} 256-bit
                  <br />
                  {t("files.keyPrefix")}: {state.key.substring(0, 16)}...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {state.isProcessing && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{t("files.processing")}</span>
              <span>{state.progress.toFixed(1)}%</span>
            </div>
            <Progress value={state.progress} />
          </div>
        )}

        {/* Result */}
        {state.result && (
          <div className="space-y-2">
            <Label>{t("files.result")}</Label>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-mono break-all">
                {state.operation === "hash"
                  ? state.result
                  : `${state.result.substring(0, 100)}${state.result.length > 100 ? '...' : ''}`
                }
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={processFile}
            disabled={!state.file || state.isProcessing || ((state.operation === "encrypt" || state.operation === "decrypt") && !state.key)}
            className="flex-1"
          >
            {state.isProcessing ? t("files.processing") : `${t("files.processButton")} ${t(`files.operations.${state.operation}`)}`}
          </Button>
          <Button variant="outline" onClick={clearFile}>
            {t("files.clear")}
          </Button>
        </div>
      </CardContent>

      {/* Hidden download link */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
    </Card>
  );
}