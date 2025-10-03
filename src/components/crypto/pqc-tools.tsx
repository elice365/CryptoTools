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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  kyberGenerateKeyPair,
  kyberEncapsulate,
  kyberDecapsulate,
  dilithiumGenerateKeyPair,
  dilithiumSign,
  dilithiumVerify,
  type KyberKeyPair,
  type DilithiumKeyPair,
  type KyberLevel,
  type DilithiumLevel,
} from "@/lib/crypto/pqc";
import { CryptoError } from "@/lib/utils";

export function PqcTools() {
  const t = useTranslations();

  // Kyber state
  const [kyberLevel, setKyberLevel] = useState<KyberLevel>(768);
  const [kyberKeys, setKyberKeys] = useState<KyberKeyPair | null>(null);
  const [kyberSharedSecret, setKyberSharedSecret] = useState("");
  const [kyberCiphertext, setKyberCiphertext] = useState("");
  const [kyberDecryptedSecret, setKyberDecryptedSecret] = useState("");
  const [kyberLoading, setKyberLoading] = useState(false);

  // Dilithium state
  const [dilithiumLevel, setDilithiumLevel] = useState<DilithiumLevel>(3);
  const [dilithiumKeys, setDilithiumKeys] = useState<DilithiumKeyPair | null>(null);
  const [dilithiumMessage, setDilithiumMessage] = useState("");
  const [dilithiumSignature, setDilithiumSignature] = useState("");
  const [dilithiumVerifyResult, setDilithiumVerifyResult] = useState("");
  const [dilithiumLoading, setDilithiumLoading] = useState(false);

  const handleKyberGenerate = async () => {
    setKyberLoading(true);
    try {
      const keys = await kyberGenerateKeyPair(kyberLevel);
      setKyberKeys(keys);
      toast.success(t("pqc.toasts.kyberKeysGenerated"));
    } catch (error) {
      console.error(t("pqc.toasts.kyberKeyGenerationError"), error);
      toast.error(error instanceof Error ? error.message : t("pqc.toasts.keyGenerationFailed"));
    } finally {
      setKyberLoading(false);
    }
  };

  const handleKyberEncapsulate = async () => {
    if (!kyberKeys) {
      toast.error(t("pqc.toasts.pleaseGenerateKeysFirst"));
      return;
    }

    setKyberLoading(true);
    try {
      const result = await kyberEncapsulate(kyberKeys.publicKey, kyberLevel);
      setKyberSharedSecret(result.sharedSecret);
      setKyberCiphertext(result.ciphertext);
      toast.success(t("pqc.toasts.sharedSecretEncapsulated"));
    } catch (error) {
      console.error(t("pqc.toasts.encapsulationError"), error);
      toast.error(error instanceof Error ? error.message : t("pqc.toasts.encapsulationFailed"));
    } finally {
      setKyberLoading(false);
    }
  };

  const handleKyberDecapsulate = async () => {
    if (!kyberKeys || !kyberCiphertext) {
      toast.error(t("pqc.toasts.pleaseEncapsulateFirst"));
      return;
    }

    setKyberLoading(true);
    try {
      const secret = await kyberDecapsulate(kyberKeys.privateKey, kyberCiphertext, kyberLevel);
      setKyberDecryptedSecret(secret);
      toast.success(t("pqc.toasts.sharedSecretDecapsulated"));
    } catch (error) {
      console.error(t("pqc.toasts.decapsulationError"), error);
      toast.error(error instanceof Error ? error.message : t("pqc.toasts.decapsulationFailed"));
    } finally {
      setKyberLoading(false);
    }
  };

  const handleDilithiumGenerate = async () => {
    setDilithiumLoading(true);
    try {
      const keys = await dilithiumGenerateKeyPair(dilithiumLevel);
      setDilithiumKeys(keys);
      toast.success(t("pqc.toasts.dilithiumKeysGenerated"));
    } catch (error) {
      console.error(t("pqc.toasts.dilithiumKeyGenerationError"), error);
      toast.error(error instanceof Error ? error.message : t("pqc.toasts.keyGenerationFailed"));
    } finally {
      setDilithiumLoading(false);
    }
  };

  const handleDilithiumSign = async () => {
    if (!dilithiumKeys) {
      toast.error(t("pqc.toasts.pleaseGenerateKeysFirst"));
      return;
    }

    if (!dilithiumMessage) {
      toast.error(t("errors.messageRequired"));
      return;
    }

    setDilithiumLoading(true);
    try {
      const signature = await dilithiumSign(dilithiumMessage, dilithiumKeys.privateKey, dilithiumLevel);
      setDilithiumSignature(signature.signature);
      toast.success(t("pqc.toasts.messageSigned"));
    } catch (error) {
      console.error(t("pqc.toasts.signingError"), error);
      toast.error(error instanceof Error ? error.message : t("errors.signingFailed"));
    } finally {
      setDilithiumLoading(false);
    }
  };

  const handleDilithiumVerify = async () => {
    if (!dilithiumKeys || !dilithiumSignature) {
      toast.error("Please sign a message first");
      return;
    }

    setDilithiumLoading(true);
    try {
      const valid = await dilithiumVerify(
        dilithiumMessage,
        dilithiumSignature,
        dilithiumKeys.publicKey,
        dilithiumLevel
      );
      setDilithiumVerifyResult(valid ? t("pqc.messages.valid") : t("pqc.messages.invalid"));
      toast.success(valid ? t("errors.signatureValid") : t("errors.signatureInvalid"));
    } catch (error) {
      console.error(t("pqc.toasts.verificationError"), error);
      toast.error(error instanceof Error ? error.message : t("errors.verificationFailed"));
    } finally {
      setDilithiumLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("pqc.title")}</CardTitle>
          <CardDescription>{t("pqc.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kyber">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="kyber">{t("pqc.tabs.kyber")}</TabsTrigger>
              <TabsTrigger value="dilithium">{t("pqc.tabs.dilithium")}</TabsTrigger>
            </TabsList>

            {/* Kyber Tab */}
            <TabsContent value="kyber" className="space-y-4">
              <div className="space-y-2">
                <Label>{t("pqc.labels.securityLevel")}</Label>
                <Select
                  value={String(kyberLevel)}
                  onValueChange={(value) => setKyberLevel(Number(value) as KyberLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">{t("pqc.selects.kyber512")}</SelectItem>
                    <SelectItem value="768">{t("pqc.selects.kyber768")}</SelectItem>
                    <SelectItem value="1024">{t("pqc.selects.kyber1024")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleKyberGenerate} disabled={kyberLoading}>
                {kyberLoading ? t("common.processing") : t("pqc.actions.generateKyberKeys")}
              </Button>

              {kyberKeys && (
                <div className="text-sm text-green-600">
                  {t("pqc.messages.keysGeneratedLevel", { level: kyberLevel })}
                </div>
              )}

              <div className="space-y-2">
                <Button onClick={handleKyberEncapsulate} disabled={kyberLoading || !kyberKeys}>
                  {t("pqc.actions.encapsulate")}
                </Button>
              </div>

              {kyberSharedSecret && (
                <div className="space-y-2">
                  <Label>{t("pqc.labels.sharedSecret")}</Label>
                  <Textarea
                    value={kyberSharedSecret}
                    readOnly
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {kyberCiphertext && (
                <div className="space-y-2">
                  <Label>{t("pqc.labels.ciphertext")}</Label>
                  <Textarea
                    value={kyberCiphertext}
                    readOnly
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {kyberCiphertext && (
                <>
                  <Button onClick={handleKyberDecapsulate} disabled={kyberLoading || !kyberKeys} variant="secondary">
                    {t("pqc.actions.decapsulate")}
                  </Button>

                  {kyberDecryptedSecret && (
                    <div className="space-y-2">
                      <Label>{t("pqc.labels.decapsulatedSecret")}</Label>
                      <Textarea
                        value={kyberDecryptedSecret}
                        readOnly
                        rows={2}
                        className="font-mono text-sm"
                      />
                      {kyberSharedSecret === kyberDecryptedSecret && (
                        <div className="text-sm text-green-600">
                          {t("pqc.messages.secretsMatch")}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Dilithium Tab */}
            <TabsContent value="dilithium" className="space-y-4">
              <div className="space-y-2">
                <Label>{t("pqc.labels.securityLevel")}</Label>
                <Select
                  value={String(dilithiumLevel)}
                  onValueChange={(value) => setDilithiumLevel(Number(value) as DilithiumLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">{t("pqc.selects.dilithium2")}</SelectItem>
                    <SelectItem value="3">{t("pqc.selects.dilithium3")}</SelectItem>
                    <SelectItem value="5">{t("pqc.selects.dilithium5")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleDilithiumGenerate} disabled={dilithiumLoading}>
                {dilithiumLoading ? t("common.processing") : t("pqc.actions.generateDilithiumKeys")}
              </Button>

              {dilithiumKeys && (
                <div className="text-sm text-green-600">
                  {t("pqc.messages.keysGeneratedLevel", { level: dilithiumLevel })}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">{t("pqc.labels.messageToSign")}</Label>
                <Textarea
                  id="message"
                  value={dilithiumMessage}
                  onChange={(e) => setDilithiumMessage(e.target.value)}
                  placeholder={t("pqc.placeholders.enterMessage")}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDilithiumSign} disabled={dilithiumLoading || !dilithiumKeys}>
                  {t("pqc.actions.signMessage")}
                </Button>
                <Button onClick={handleDilithiumVerify} variant="secondary" disabled={dilithiumLoading || !dilithiumSignature}>
                  {t("pqc.actions.verifySignature")}
                </Button>
              </div>

              {dilithiumSignature && (
                <div className="space-y-2">
                  <Label>{t("pqc.labels.signature")}</Label>
                  <Textarea
                    value={dilithiumSignature}
                    readOnly
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {dilithiumVerifyResult && (
                <div className="p-4 border rounded-lg">
                  <div className="text-lg font-semibold">{dilithiumVerifyResult}</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
