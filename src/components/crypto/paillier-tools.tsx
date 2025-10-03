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
  generatePaillierKeyPair,
  paillierEncrypt,
  paillierDecrypt,
  paillierAdd,
  paillierMultiply,
  type PaillierKeyPair,
} from "@/lib/crypto/paillier";
import { CryptoError } from "@/lib/utils";

export function PaillierTools() {
  const t = useTranslations();
  const [keys, setKeys] = useState<PaillierKeyPair | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [cipher1, setCipher1] = useState("");
  const [cipher2, setCipher2] = useState("");
  const [scalar, setScalar] = useState("");
  const [homomorphicResult, setHomomorphicResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateKeys = async () => {
    setIsProcessing(true);
    try {
      const keyPair = await generatePaillierKeyPair(512);
      setKeys(keyPair);
      toast.success(t("paillier.toasts.keysGenerated"));
    } catch (error) {
      console.error(t("paillier.toasts.keyGenerationError"), error);
      toast.error(error instanceof Error ? error.message : t("paillier.toasts.keyGenerationFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncrypt = () => {
    if (!keys) {
      toast.error(t("paillier.toasts.pleaseGenerateKeysFirst"));
      return;
    }

    if (!input) {
      toast.error(t("errors.inputRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const ciphertext = paillierEncrypt(keys.publicKey, input);
      setOutput(ciphertext.value);
      toast.success(t("paillier.toasts.numberEncrypted"));
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error(t("paillier.toasts.invalidNumberOrEncryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = () => {
    if (!keys) {
      toast.error(t("paillier.toasts.pleaseGenerateKeysFirst"));
      return;
    }

    if (!input) {
      toast.error(t("paillier.toasts.pleaseEnterCiphertextToDecrypt"));
      return;
    }

    setIsProcessing(true);
    try {
      const ciphertext = { value: input, encoding: "hex" as const };
      const plaintext = paillierDecrypt(keys.privateKey, ciphertext);
      setOutput(plaintext);
      toast.success(t("paillier.toasts.numberDecrypted"));
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error(t("errors.decryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdd = () => {
    if (!keys) {
      toast.error(t("paillier.toasts.keysAreRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const c1 = { value: cipher1, encoding: "hex" as const };
      const c2 = { value: cipher2, encoding: "hex" as const };
      const result = paillierAdd(keys.publicKey, c1, c2);
      setHomomorphicResult(result.value);
      toast.success(t("paillier.toasts.ciphertextsAdded"));
    } catch (error) {
      console.error("Addition error:", error);
      toast.error(error instanceof Error ? error.message : t("paillier.toasts.additionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiply = () => {
    if (!cipher1 || !scalar) {
      toast.error(t("paillier.toasts.pleaseEnterCiphertextAndScalar"));
      return;
    }

    if (!keys) {
      toast.error(t("paillier.toasts.keysAreRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const c = { value: cipher1, encoding: "hex" as const };
      const result = paillierMultiply(keys.publicKey, c, scalar);
      setHomomorphicResult(result.value);
      toast.success(t("paillier.toasts.ciphertextMultiplied"));
    } catch (error) {
      console.error("Multiplication error:", error);
      toast.error(error instanceof Error ? error.message : t("paillier.toasts.multiplicationFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Generation */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paillier.title")}</CardTitle>
          <CardDescription>{t("paillier.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateKeys} disabled={isProcessing}>
            {isProcessing ? t("common.processing") : t("paillier.actions.generateKeys")}
          </Button>
          {keys && (
            <div className="text-sm text-green-600">
              ✓ Keys generated (Bit length: 512)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encryption/Decryption */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paillier.sections.encryptionDecryption")}</CardTitle>
          <CardDescription>{t("paillier.sections.encryptDecryptNumbers")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input">{t("paillier.labels.numberCiphertext")}</Label>
            <Input
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("paillier.placeholders.enterNumberOrCiphertext")}
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
                rows={2}
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
          <CardTitle>{t("paillier.sections.homomorphicOperations")}</CardTitle>
          <CardDescription>
            {t("paillier.sections.performAdditiveOperations")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cipher1">{t("paillier.labels.ciphertext1")}</Label>
            <Input
              id="cipher1"
              value={cipher1}
              onChange={(e) => setCipher1(e.target.value)}
              placeholder={t("paillier.placeholders.enterFirstCiphertext")}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cipher2">{t("paillier.labels.ciphertext2")}</Label>
            <Input
              id="cipher2"
              value={cipher2}
              onChange={(e) => setCipher2(e.target.value)}
              placeholder={t("paillier.placeholders.enterSecondCiphertext")}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scalar">{t("paillier.labels.scalar")}</Label>
            <Input
              id="scalar"
              value={scalar}
              onChange={(e) => setScalar(e.target.value)}
              placeholder={t("paillier.placeholders.enterScalarNumber")}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={isProcessing || !keys}>
              {t("paillier.actions.addC1C2")}
            </Button>
            <Button onClick={handleMultiply} variant="secondary" disabled={isProcessing || !keys}>
              {t("paillier.actions.multiplyC1Scalar")}
            </Button>
          </div>

          {homomorphicResult && (
            <div className="space-y-2">
              <Label htmlFor="result">{t("paillier.labels.resultEncrypted")}</Label>
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
