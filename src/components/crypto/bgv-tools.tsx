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
  generateBgvKeyPair,
  encryptText,
  decryptToText,
  addCiphertexts,
  multiplyCiphertexts,
  stringifyCiphertext,
  parseCiphertext,
  type BgvKeyPair,
  type BgvCiphertext,
} from "@/lib/crypto/bgv";
import { CryptoError } from "@/lib/utils";

export function BgvTools() {
  const t = useTranslations();
  const [keys, setKeys] = useState<BgvKeyPair | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [cipher1, setCipher1] = useState("");
  const [cipher2, setCipher2] = useState("");
  const [homomorphicResult, setHomomorphicResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateKeys = () => {
    setIsProcessing(true);
    try {
      const keyPair = generateBgvKeyPair();
      setKeys(keyPair);
      toast.success(t("bgv.toasts.keysGenerated"));
    } catch (error) {
      console.error("Key generation error:", error);
      toast.error(error instanceof Error ? error.message : t("bgv.toasts.keyGenerationFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncrypt = () => {
    if (!keys) {
      toast.error(t("bgv.toasts.pleaseGenerateKeysFirst"));
      return;
    }

    if (!input) {
      toast.error(t("errors.inputRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const ciphertext = encryptText(keys.publicKey, input, keys.params);
      const serialized = stringifyCiphertext(ciphertext);
      setOutput(serialized);
      toast.success(t("bgv.toasts.textEncrypted"));
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error(error instanceof CryptoError ? error.message : t("errors.encryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = () => {
    if (!keys) {
      toast.error("Please generate keys first");
      return;
    }

    if (!input) {
      toast.error(t("bgv.toasts.pleaseEnterCiphertextToDecrypt"));
      return;
    }

    setIsProcessing(true);
    try {
      const ciphertext = parseCiphertext(input);
      const plaintext = decryptToText(keys.secretKey, ciphertext, keys.params);
      setOutput(plaintext);
      toast.success(t("bgv.toasts.textDecrypted"));
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error(error instanceof CryptoError ? error.message : t("errors.decryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdd = () => {
    if (!keys) {
      toast.error(t("bgv.toasts.keysRequiredForParameters"));
      return;
    }

    setIsProcessing(true);
    try {
      const c1 = parseCiphertext(cipher1);
      const c2 = parseCiphertext(cipher2);
      const result = addCiphertexts(c1, c2, keys.params);
      setHomomorphicResult(stringifyCiphertext(result));
      toast.success(t("bgv.toasts.ciphertextsAdded"));
    } catch (error) {
      console.error("Addition error:", error);
      toast.error(error instanceof Error ? error.message : t("bgv.toasts.additionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiply = () => {
    if (!cipher1 || !cipher2) {
      toast.error(t("bgv.toasts.pleaseEnterTwoCiphertextsToMultiply"));
      return;
    }

    if (!keys) {
      toast.error(t("bgv.toasts.keysRequiredForParameters"));
      return;
    }

    setIsProcessing(true);
    try {
      const c1 = parseCiphertext(cipher1);
      const c2 = parseCiphertext(cipher2);
      const result = multiplyCiphertexts(keys.secretKey, c1, c2, keys.params);
      setHomomorphicResult(stringifyCiphertext(result));
      toast.success(t("bgv.toasts.ciphertextsMultiplied"));
    } catch (error) {
      console.error("Multiplication error:", error);
      toast.error(error instanceof Error ? error.message : t("bgv.toasts.multiplicationFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Generation */}
      <Card>
        <CardHeader>
          <CardTitle>{t("bgv.title")}</CardTitle>
          <CardDescription>{t("bgv.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateKeys} disabled={isProcessing}>
            {isProcessing ? t("common.processing") : t("bgv.actions.generateKeys")}
          </Button>
          {keys && (
            <div className="text-sm text-green-600">
              ✓ Keys generated (n={keys.params.n}, q={keys.params.q.toString()})
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encryption/Decryption */}
      <Card>
        <CardHeader>
          <CardTitle>{t("bgv.sections.encryptionDecryption")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input">{t("common.input")}</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("bgv.placeholders.textOrCiphertext")}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleEncrypt} disabled={isProcessing || !keys}>
              {isProcessing ? t("common.processing") : t("common.encrypt")}
            </Button>
            <Button onClick={handleDecrypt} variant="secondary" disabled={isProcessing || !keys}>
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

      {/* Homomorphic Operations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("bgv.sections.homomorphicOperations")}</CardTitle>
          <CardDescription>
            {t("bgv.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cipher1">{t("bgv.labels.ciphertext1")}</Label>
            <Textarea
              id="cipher1"
              value={cipher1}
              onChange={(e) => setCipher1(e.target.value)}
              placeholder={t("bgv.placeholders.firstCiphertext")}
              rows={2}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cipher2">{t("bgv.labels.ciphertext2")}</Label>
            <Textarea
              id="cipher2"
              value={cipher2}
              onChange={(e) => setCipher2(e.target.value)}
              placeholder={t("bgv.placeholders.secondCiphertext")}
              rows={2}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={isProcessing || !keys}>
            {t("bgv.actions.add")}
            </Button>
            <Button onClick={handleMultiply} variant="secondary" disabled={isProcessing || !keys}>
              {t("bgv.actions.multiply")}
            </Button>
          </div>

          {homomorphicResult && (
            <div className="space-y-2">
              <Label htmlFor="result">{t("bgv.labels.resultEncrypted")}</Label>
              <Textarea
                id="result"
                value={homomorphicResult}
                readOnly
                rows={2}
                className="font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(homomorphicResult);
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
