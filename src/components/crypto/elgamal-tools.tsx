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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  generateElGamalParameters,
  generateElGamalKeyPair,
  elgamalEncrypt,
  elgamalDecrypt,
  exportElGamalKey,
  importElGamalKey,
  type ElGamalKeyPair,
  type ElGamalParameters,
  type ElGamalCipher,
} from "@/lib/crypto/elgamal";
import { CryptoError } from "@/lib/utils";

export function ElgamalTools() {
  const t = useTranslations();
  const [bitLength, setBitLength] = useState(512);
  const [params, setParams] = useState<ElGamalParameters | null>(null);
  const [keys, setKeys] = useState<ElGamalKeyPair | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateKeys = async () => {
    setIsProcessing(true);
    try {
      const newParams = generateElGamalParameters(bitLength);
      const newKeys = generateElGamalKeyPair(newParams);
      
      setParams(newParams);
      setKeys(newKeys);
      setPublicKey(exportElGamalKey(newKeys.publicKey));
      setPrivateKey(exportElGamalKey(newKeys.privateKey));
      
      toast.success(t("asymmetric.elgamal.generated"));
    } catch (error) {
      console.error(t("elgamal.toasts.keyGenerationError"), error);
      toast.error(error instanceof Error ? error.message : t("errors.keyGenerationFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncrypt = () => {
    if (!keys || !params) {
      toast.error(t("elgamal.toasts.pleaseGenerateKeysFirst"));
      return;
    }

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
      const pubKey = importElGamalKey(publicKey, "hex");
      const cipher = elgamalEncrypt(params, pubKey, input);
      setOutput(JSON.stringify(cipher, null, 2));
      toast.success(t("asymmetric.elgamal.encrypted"));
    } catch (error) {
      console.error(t("elgamal.toasts.encryptionError"), error);
      toast.error(error instanceof CryptoError ? error.message : t("errors.encryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = () => {
    if (!keys || !params) {
      toast.error(t("elgamal.toasts.pleaseGenerateKeysFirst"));
      return;
    }

    if (!input) {
      toast.error(t("elgamal.toasts.pleaseEnterCiphertextToDecrypt"));
      return;
    }

    setIsProcessing(true);
    try {
      const privKey = importElGamalKey(privateKey, "hex");
      const cipher = JSON.parse(input) as ElGamalCipher;
      const plaintext = elgamalDecrypt(params, privKey, cipher);
      setOutput(plaintext);
      toast.success(t("asymmetric.elgamal.decrypted"));
    } catch (error) {
      console.error(t("elgamal.toasts.decryptionError"), error);
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
          <CardTitle>{t("elgamal.title")}</CardTitle>
          <CardDescription>{t("elgamal.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bits">{t("asymmetric.elgamal.bitLength")}</Label>
            <Select
              value={String(bitLength)}
              onValueChange={(value) => setBitLength(Number(value))}
            >
              <SelectTrigger id="bits">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="256">{t("elgamal.selects.bits256")}</SelectItem>
                <SelectItem value="512">{t("elgamal.selects.bits512")}</SelectItem>
                <SelectItem value="1024">{t("elgamal.selects.bits1024")}</SelectItem>
                <SelectItem value="2048">{t("elgamal.selects.bits2048")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateKeys} disabled={isProcessing}>
            {isProcessing ? t("common.processing") : t("asymmetric.elgamal.generate")}
          </Button>

          {keys && (
            <>
              <div className="space-y-2">
                <Label htmlFor="public-key">{t("asymmetric.publicKey")}</Label>
                <Textarea
                  id="public-key"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder={t("asymmetric.elgamal.publicPlaceholder")}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="private-key">{t("asymmetric.privateKey")}</Label>
                <Textarea
                  id="private-key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={t("asymmetric.elgamal.privatePlaceholder")}
                  rows={3}
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
          <CardTitle>{t("elgamal.sections.encryptionDecryption")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input">{t("common.input")}</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("asymmetric.placeholders.input")}
              rows={4}
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
