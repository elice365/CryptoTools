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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { desEncrypt, desDecrypt } from "@/lib/crypto/symmetric";
import { CryptoError, cryptoUtils } from "@/lib/utils";

export function DesTools() {
  const t = useTranslations();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [key, setKey] = useState("");
  const [iv, setIv] = useState("");
  const [mode, setMode] = useState<"cbc" | "ecb">("cbc");
  const [outputEncoding, setOutputEncoding] = useState<"hex" | "base64">("base64");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateKey = () => {
    const keyBytes = crypto.getRandomValues(new Uint8Array(8)); // DES uses 8-byte keys
    const generated = outputEncoding === "hex"
      ? cryptoUtils.bytesToHex(keyBytes)
      : btoa(String.fromCharCode(...keyBytes));
    setKey(generated);
    toast.success(t("messages.keyGenerated"));
  };

  const handleGenerateIV = () => {
    const ivBytes = crypto.getRandomValues(new Uint8Array(8)); // DES uses 8-byte IV
    const generated = outputEncoding === "hex"
      ? cryptoUtils.bytesToHex(ivBytes)
      : btoa(String.fromCharCode(...ivBytes));
    setIv(generated);
    toast.success(t("messages.ivGenerated"));
  };

  const handleEncrypt = async () => {
    if (!key) {
      toast.error(t("errors.keyRequired"));
      return;
    }
    if (!input) {
      toast.error(t("errors.inputRequired"));
      return;
    }
    if (mode !== "ecb" && !iv) {
      toast.error(t("errors.ivRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await desEncrypt(input, {
        key,
        keyEncoding: outputEncoding,
        iv: mode === "ecb" ? undefined : iv,
        ivEncoding: outputEncoding,
        mode,
        outputEncoding,
      });
      setOutput(result.cipherText);
      if (result.iv && !iv) {
        setIv(result.iv);
      }
      toast.success(t("messages.encrypted"));
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error(error instanceof CryptoError ? error.message : t("errors.encryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!key) {
      toast.error(t("errors.keyRequired"));
      return;
    }
    if (!input) {
      toast.error(t("errors.inputRequired"));
      return;
    }
    if (mode !== "ecb" && !iv) {
      toast.error(t("errors.ivRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const plaintext = await desDecrypt(input, {
        key,
        keyEncoding: outputEncoding,
        iv: mode === "ecb" ? undefined : iv,
        ivEncoding: outputEncoding,
        mode,
        outputEncoding,
      });
      setOutput(plaintext);
      toast.success(t("messages.decrypted"));
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error(error instanceof CryptoError ? error.message : t("errors.decryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("des.title")}</CardTitle>
          <CardDescription>{t("des.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mode">{t("common.mode")}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "cbc" | "ecb")}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cbc">CBC</SelectItem>
                <SelectItem value="ecb">ECB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="encoding">{t("common.encoding")}</Label>
            <Select value={outputEncoding} onValueChange={(v) => setOutputEncoding(v as "hex" | "base64")}>
              <SelectTrigger id="encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base64">Base64</SelectItem>
                <SelectItem value="hex">Hex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">{t("common.key")}</Label>
            <div className="flex gap-2">
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter 8-byte key..."
                className="font-mono text-sm"
              />
              <Button onClick={handleGenerateKey} variant="outline">
                {t("common.generate")}
              </Button>
            </div>
          </div>

          {mode !== "ecb" && (
            <div className="space-y-2">
              <Label htmlFor="iv">{t("common.iv")}</Label>
              <div className="flex gap-2">
                <Input
                  id="iv"
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  placeholder="Enter 8-byte IV..."
                  className="font-mono text-sm"
                />
                <Button onClick={handleGenerateIV} variant="outline">
                  {t("common.generate")}
                </Button>
              </div>
            </div>
          )}

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
            <Button onClick={handleEncrypt} disabled={isProcessing}>
              {isProcessing ? t("common.processing") : t("common.encrypt")}
            </Button>
            <Button onClick={handleDecrypt} variant="secondary" disabled={isProcessing}>
              {t("common.decrypt")}
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
                rows={4}
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
