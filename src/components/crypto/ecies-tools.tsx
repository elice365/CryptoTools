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
import {
  generateEccKeyPair,
  exportEccKeyPair,
  eccEncrypt,
  eccDecrypt,
  type EciesCipher,
} from "@/lib/crypto/ecc";
import { CryptoError } from "@/lib/utils";

export function EciesTools() {
  const t = useTranslations();
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [encoding, setEncoding] = useState<"base64" | "hex">("base64");
  const [cipherData, setCipherData] = useState<EciesCipher | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateKeys = () => {
    setIsProcessing(true);
    try {
      const keyPair = generateEccKeyPair();
      const exported = exportEccKeyPair(keyPair, encoding);
      setPublicKey(exported.publicKey);
      setPrivateKey(exported.privateKey);
      toast.success(t("messages.keysGenerated"));
    } catch (error) {
      console.error("Key generation error:", error);
      toast.error(error instanceof Error ? error.message : t("errors.keyGenerationFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncrypt = () => {
    if (!publicKey) {
      toast.error(t("errors.publicKeyRequired"));
      return;
    }
    if (!input) {
      toast.error(t("errors.inputRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const result = eccEncrypt(input, publicKey, {
        encoding,
        publicKeyEncoding: encoding,
      });
      setCipherData(result.payload);
      setOutput(JSON.stringify(result.payload, null, 2));
      toast.success(t("messages.encrypted"));
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error(error instanceof CryptoError ? error.message : t("errors.encryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = () => {
    if (!privateKey) {
      toast.error(t("errors.privateKeyRequired"));
      return;
    }

    let payload: EciesCipher;
    try {
      payload = input ? JSON.parse(input) : cipherData;
      if (!payload) {
        toast.error(t("errors.cipherDataRequired"));
        return;
      }
    } catch (e) {
      toast.error(t("errors.invalidCipherData"));
      return;
    }

    setIsProcessing(true);
    try {
      const plaintext = eccDecrypt(payload, privateKey, {
        encoding,
        privateKeyEncoding: encoding,
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
      {/* Key Generation */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ecies.title")}</CardTitle>
          <CardDescription>{t("ecies.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encoding">{t("common.encoding")}</Label>
            <Select value={encoding} onValueChange={(v) => setEncoding(v as "base64" | "hex")}>
              <SelectTrigger id="encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base64">Base64</SelectItem>
                <SelectItem value="hex">Hex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateKeys} disabled={isProcessing}>
            {isProcessing ? t("common.processing") : t("common.generateKeys")}
          </Button>

          {publicKey && (
            <>
              <div className="space-y-2">
                <Label htmlFor="publicKey">{t("common.publicKey")}</Label>
                <Textarea
                  id="publicKey"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  rows={2}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateKey">{t("common.privateKey")}</Label>
                <Textarea
                  id="privateKey"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  rows={2}
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Encryption/Decryption */}
      <Card>
        <CardHeader>
          <CardTitle>{t("common.encryptionDecryption")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button onClick={handleEncrypt} disabled={isProcessing || !publicKey}>
              {isProcessing ? t("common.processing") : t("common.encrypt")}
            </Button>
            <Button onClick={handleDecrypt} variant="secondary" disabled={isProcessing || !privateKey}>
              {t("common.decrypt")}
            </Button>
            <Button onClick={() => { setInput(""); setOutput(""); setCipherData(null); }} variant="outline">
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
                rows={6}
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
