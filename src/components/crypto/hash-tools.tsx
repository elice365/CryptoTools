"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import {
  type HashAlgorithm,
  type HashEncoding,
  hashFile,
  hashString,
} from "@/lib/crypto";
import { FileUpload } from "@/components/ui/file-upload";

const HASH_ALGORITHMS: HashAlgorithm[] = [
  "sha1",
  "sha224",
  "sha256",
  "sha384",
  "sha512",
  "sha3-224",
  "sha3-256",
  "sha3-384",
  "sha3-512",
  "blake2b",
  "blake2s",
];

export function HashTools() {
  const t = useTranslations();
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("sha256");
  const [encoding, setEncoding] = useState<HashEncoding>("hex");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileUploadTranslations = useMemo(
    () => ({
      dragText: t("files.dragText"),
      dragDescription: t("files.dragDescription"),
      fileSelected: t("files.fileSelected"),
      largeFile: t("files.largeFile"),
      normalFile: t("files.normalFile"),
      selectFile: t("common.selectFile"),
      changeFile: t("common.changeFile"),
      removeFile: t("common.removeFile"),
    }),
    [t],
  );

  const handleHash = async () => {
    setIsProcessing(true);
    try {
      let output: string;
      if (file) {
        output = await hashFile(file, algorithm, encoding);
      } else {
        output = hashString(input, algorithm, encoding);
      }
      setResult(output);
      toast.success(t("hash.actions.completed"));
    } catch (_error) {
      toast.error(t("errors.hashingFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success(t("messages.copied"));
    } catch (_error) {
      toast.error(t("errors.copyFailed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("hash.title")}</CardTitle>
        <CardDescription>{t("hash.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="hash-algorithm"
            >
              {t("hash.labels.algorithm")}
            </label>
            <Select
              value={algorithm}
              onValueChange={(value: HashAlgorithm) => setAlgorithm(value)}
            >
              <SelectTrigger id="hash-algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HASH_ALGORITHMS.map((algo) => (
                  <SelectItem key={algo} value={algo}>
                    {t(`hash.algorithms.${algo}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="hash-encoding"
            >
              {t("hash.labels.outputFormat")}
            </label>
            <Select
              value={encoding}
              onValueChange={(value: HashEncoding) => setEncoding(value)}
            >
              <SelectTrigger id="hash-encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hex">HEX</SelectItem>
                <SelectItem value="base64">Base64</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-muted-foreground"
            htmlFor="hash-file"
          >
            {t("hash.labels.fileInput")}
          </label>
          <FileUpload
            value={file}
            onChange={(selected) => {
              setFile(selected);
              if (selected) {
                setInput("");
              }
            }}
            translations={fileUploadTranslations}
          />
        </div>

        <Textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (event.target.value) {
              setFile(null);
            }
          }}
          placeholder={t("hash.labels.textPlaceholder")}
          rows={6}
        />

        <Button onClick={handleHash} disabled={isProcessing}>
          {isProcessing ? t("actions.processing") : t("hash.actions.generate")}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Textarea
          value={result}
          readOnly
          rows={6}
          placeholder={t("hash.labels.resultPlaceholder")}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} disabled={!result}>
            {t("actions.copy")}
          </Button>
          <Button variant="ghost" onClick={() => setResult("")}>
            {t("actions.clear")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
