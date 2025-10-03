"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hashString, type HashAlgorithm, type HashEncoding } from "@/lib/crypto/hashing";

export function Blake2Tools() {
  const t = useTranslations();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("blake2b");
  const [encoding, setEncoding] = useState<HashEncoding>("hex");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleHash = () => {
    if (!input) {
      toast.error(t("errors.inputRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const hash = hashString(input, algorithm, encoding);
      setOutput(hash);
      toast.success(t("messages.hashGenerated"));
    } catch (error) {
      console.error("Hashing error:", error);
      toast.error(error instanceof Error ? error.message : t("errors.hashFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("blake2.title")}</CardTitle>
          <CardDescription>{t("blake2.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="algorithm">{t("common.algorithm")}</Label>
            <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as HashAlgorithm)}>
              <SelectTrigger id="algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blake2b">BLAKE2b</SelectItem>
                <SelectItem value="blake2s">BLAKE2s</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="encoding">{t("common.encoding")}</Label>
            <Select value={encoding} onValueChange={(v) => setEncoding(v as HashEncoding)}>
              <SelectTrigger id="encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hex">Hex</SelectItem>
                <SelectItem value="base64">Base64</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">{t("common.input")}</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("common.enterText")}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleHash} disabled={isProcessing}>
              {isProcessing ? t("common.processing") : t("common.hash")}
            </Button>
            <Button onClick={() => { setInput(""); setOutput(""); }} variant="outline">
              {t("common.clear")}
            </Button>
          </div>

          {output && (
            <div className="space-y-2">
              <Label htmlFor="output">{t("common.output")}</Label>
              <Textarea
                id="output"
                value={output}
                readOnly
                rows={3}
                className="font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success(t("messages.copied"));
                }}
                variant="outline"
                size="sm"
              >
                {t("common.copy")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
