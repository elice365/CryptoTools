"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type ExportedEccKeyPair,
  type ElGamalCipher,
  type EciesCipher,
  eccDecrypt,
  eccEncrypt,
  exportEccKeyPair,
  generateEccKeyPair,
  generateElGamalKeyPair,
  generateElGamalParameters,
  generateRsaKeyPair,
  importElGamalKey,
  importRsaPrivateKey,
  importRsaPublicKey,
  rsaDecrypt,
  rsaEncrypt,
  exportElGamalKey,
  elgamalEncrypt,
  elgamalDecrypt,
  exportRsaKeyPair,
} from "@/lib/crypto";
import type { ElGamalKeyPair, ElGamalParameters } from "@/lib/crypto/elgamal";
import { CryptoError } from "@/lib/utils";
import { CryptoHelper } from "./crypto-helper";

export function AsymmetricTools() {
  const t = useTranslations();

  // RSA state
  const [rsaPublicPem, setRsaPublicPem] = useState("");
  const [rsaPrivatePem, setRsaPrivatePem] = useState("");
  const [rsaInput, setRsaInput] = useState("");
  const [rsaOutput, setRsaOutput] = useState("");
  const [rsaLoading, setRsaLoading] = useState(false);
  const [rsaCryptoError, setRsaCryptoError] = useState<string | null>(null);

  // ECC state
  const [eccKeys, setEccKeys] = useState<ExportedEccKeyPair | null>(null);
  const [eccRecipientKey, setEccRecipientKey] = useState("");
  const [eccInput, setEccInput] = useState("");
  const [eccOutput, setEccOutput] = useState("");
  const [eccLoading, setEccLoading] = useState(false);

  // ElGamal state
  const [elgamalParams, setElgamalParams] = useState<ElGamalParameters | null>(
    null,
  );
  const [elgamalKeys, setElgamalKeys] = useState<ElGamalKeyPair | null>(null);
  const [elgamalPublic, setElgamalPublic] = useState("");
  const [elgamalPrivate, setElgamalPrivate] = useState("");
  const [elgamalInput, setElgamalInput] = useState("");
  const [elgamalOutput, setElgamalOutput] = useState("");
  const [elgamalBits, setElgamalBits] = useState(512);
  const [elgamalLoading, setElgamalLoading] = useState(false);

  const handleRsaGenerate = async () => {
    setRsaLoading(true);
    try {
      // Debug Web Crypto API availability for RSA
      console.log('RSA Browser environment check:', typeof window !== 'undefined');
      console.log('RSA window.crypto exists:', typeof window !== 'undefined' && !!window.crypto);
      console.log('RSA window.crypto.subtle exists:', typeof window !== 'undefined' && !!window.crypto?.subtle);
      console.log('RSA Location protocol:', typeof window !== 'undefined' ? window.location?.protocol : 'N/A');

      const keys = await generateRsaKeyPair(2048);
      const exported = await exportRsaKeyPair(keys);
      setRsaPublicPem(exported.publicKey);
      setRsaPrivatePem(exported.privateKey);
      toast.success(t("asymmetric.rsa.generated"));
    } catch (error) {
      console.error("RSA key generation error:", error);
      const errorMessage = error instanceof Error ? error.message : t("errors.keyGenerationFailed");
      setRsaCryptoError(errorMessage);
      toast.error(`키 생성 실패: ${errorMessage}`);
    } finally {
      setRsaLoading(false);
    }
  };

  const handleRsaEncrypt = async () => {
    if (!rsaPublicPem) {
      toast.error(t("errors.publicKeyRequired"));
      return;
    }
    try {
      const publicKey = await importRsaPublicKey(rsaPublicPem);
      const cipher = await rsaEncrypt(rsaInput, publicKey);
      setRsaOutput(cipher);
      toast.success(t("asymmetric.rsa.encrypted"));
    } catch (error) {
      const message =
        error instanceof CryptoError
          ? error.message
          : t("errors.encryptionFailed");
      toast.error(message);
    }
  };

  const handleRsaDecrypt = async () => {
    if (!rsaPrivatePem) {
      toast.error(t("errors.privateKeyRequired"));
      return;
    }
    try {
      const privateKey = await importRsaPrivateKey(rsaPrivatePem);
      const plaintext = await rsaDecrypt(rsaInput, privateKey);
      setRsaOutput(plaintext);
      toast.success(t("asymmetric.rsa.decrypted"));
    } catch (error) {
      const message =
        error instanceof CryptoError
          ? error.message
          : t("errors.decryptionFailed");
      toast.error(message);
    }
  };

  const handleEccGenerate = () => {
    const pair = generateEccKeyPair();
    const exported = exportEccKeyPair(pair);
    setEccKeys(exported);
    setEccRecipientKey(exported.publicKey);
    toast.success(t("asymmetric.ecc.generated"));
  };

  const handleEccEncrypt = () => {
    if (!eccRecipientKey) {
      toast.error(t("errors.publicKeyRequired"));
      return;
    }
    setEccLoading(true);
    try {
      const { payload } = eccEncrypt(eccInput, eccRecipientKey, {
        encoding: "base64",
      });
      setEccOutput(JSON.stringify(payload, null, 2));
      toast.success(t("asymmetric.ecc.encrypted"));
    } catch (error) {
      const message =
        error instanceof CryptoError
          ? error.message
          : t("errors.encryptionFailed");
      toast.error(message);
    } finally {
      setEccLoading(false);
    }
  };

  const handleEccDecrypt = () => {
    if (!eccKeys?.privateKey) {
      toast.error(t("errors.privateKeyRequired"));
      return;
    }
    setEccLoading(true);
    try {
      const payload = JSON.parse(eccInput) as EciesCipher;
      const plaintext = eccDecrypt(payload, eccKeys.privateKey);
      setEccOutput(plaintext);
      toast.success(t("asymmetric.ecc.decrypted"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.decryptionFailed");
      toast.error(message);
    } finally {
      setEccLoading(false);
    }
  };

  const handleElGamalGenerate = async () => {
    setElgamalLoading(true);
    try {
      const params = await Promise.resolve(
        generateElGamalParameters(elgamalBits),
      );
      const keys = generateElGamalKeyPair(params);
      setElgamalParams(params);
      setElgamalKeys(keys);
      setElgamalPublic(exportElGamalKey(keys.publicKey));
      setElgamalPrivate(exportElGamalKey(keys.privateKey));
      toast.success(t("asymmetric.elgamal.generated"));
    } catch (error) {
      toast.error(t("errors.keyGenerationFailed"));
    } finally {
      setElgamalLoading(false);
    }
  };

  const handleElGamalEncrypt = () => {
    if (!elgamalParams) {
      toast.error(t("errors.parametersMissing"));
      return;
    }
    if (!elgamalPublic) {
      toast.error(t("errors.publicKeyRequired"));
      return;
    }
    try {
      const publicKey = importElGamalKey(elgamalPublic, "hex");
      const cipher = elgamalEncrypt(
        elgamalParams,
        publicKey,
        elgamalInput,
        "hex",
      );
      setElgamalOutput(JSON.stringify(cipher, null, 2));
      toast.success(t("asymmetric.elgamal.encrypted"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.encryptionFailed");
      toast.error(message);
    }
  };

  const handleElGamalDecrypt = () => {
    if (!elgamalParams || !elgamalPrivate) {
      toast.error(t("errors.privateKeyRequired"));
      return;
    }
    try {
      const privateKey = importElGamalKey(elgamalPrivate, "hex");
      const cipher = JSON.parse(elgamalInput) as ElGamalCipher;
      const plaintext = elgamalDecrypt(elgamalParams, privateKey, cipher);
      setElgamalOutput(plaintext);
      toast.success(t("asymmetric.elgamal.decrypted"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.decryptionFailed");
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("asymmetric.title")}</CardTitle>
        <CardDescription>{t("asymmetric.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rsa" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rsa">RSA</TabsTrigger>
            <TabsTrigger value="ecc">ECC</TabsTrigger>
            <TabsTrigger value="elgamal">ElGamal</TabsTrigger>
          </TabsList>

          <TabsContent value="rsa" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRsaGenerate} disabled={rsaLoading}>
                {rsaLoading
                  ? t("actions.processing")
                  : t("asymmetric.rsa.generate")}
              </Button>
              <Button variant="outline" onClick={() => setRsaOutput("")}>
                {t("actions.clear")}
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                value={rsaPublicPem}
                onChange={(event) => setRsaPublicPem(event.target.value)}
                placeholder={t("asymmetric.rsa.publicPlaceholder")}
                rows={6}
              />
              <Textarea
                value={rsaPrivatePem}
                onChange={(event) => setRsaPrivatePem(event.target.value)}
                placeholder={t("asymmetric.rsa.privatePlaceholder")}
                rows={6}
              />
            </div>
            <Textarea
              value={rsaInput}
              onChange={(event) => setRsaInput(event.target.value)}
              placeholder={t("asymmetric.placeholders.input")}
              rows={5}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRsaEncrypt}>{t("actions.encrypt")}</Button>
              <Button variant="secondary" onClick={handleRsaDecrypt}>
                {t("actions.decrypt")}
              </Button>
            </div>
            <Textarea
              value={rsaOutput}
              readOnly
              rows={5}
              placeholder={t("asymmetric.placeholders.output")}
            />
          </TabsContent>

          <TabsContent value="ecc" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEccGenerate}>
                {t("asymmetric.ecc.generate")}
              </Button>
              <Button variant="outline" onClick={() => setEccOutput("")}>
                {t("actions.clear")}
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                value={eccKeys?.publicKey ?? ""}
                readOnly
                rows={4}
                placeholder={t("asymmetric.ecc.publicPlaceholder")}
              />
              <Textarea
                value={eccKeys?.privateKey ?? ""}
                readOnly
                rows={4}
                placeholder={t("asymmetric.ecc.privatePlaceholder")}
              />
            </div>
            <Textarea
              value={eccRecipientKey}
              onChange={(event) => setEccRecipientKey(event.target.value)}
              placeholder={t("asymmetric.ecc.recipientPlaceholder")}
              rows={4}
            />
            <Textarea
              value={eccInput}
              onChange={(event) => setEccInput(event.target.value)}
              placeholder={t("asymmetric.placeholders.input")}
              rows={5}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEccEncrypt} disabled={eccLoading}>
                {eccLoading ? t("actions.processing") : t("actions.encrypt")}
              </Button>
              <Button
                variant="secondary"
                onClick={handleEccDecrypt}
                disabled={eccLoading}
              >
                {eccLoading ? t("actions.processing") : t("actions.decrypt")}
              </Button>
            </div>
            <Textarea
              value={eccOutput}
              readOnly
              rows={6}
              placeholder={t("asymmetric.placeholders.output")}
            />
          </TabsContent>

          <TabsContent value="elgamal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="elgamal-bits"
                >
                  {t("asymmetric.elgamal.bitLength")}
                </label>
                <Select
                  value={String(elgamalBits)}
                  onValueChange={(value) => setElgamalBits(Number(value))}
                >
                  <SelectTrigger id="elgamal-bits">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512</SelectItem>
                    <SelectItem value="768">768</SelectItem>
                    <SelectItem value="1024">1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleElGamalGenerate}
                  disabled={elgamalLoading}
                >
                  {elgamalLoading
                    ? t("actions.processing")
                    : t("asymmetric.elgamal.generate")}
                </Button>
                <Button variant="outline" onClick={() => setElgamalOutput("")}>
                  {t("actions.clear")}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                value={elgamalPublic}
                onChange={(event) => setElgamalPublic(event.target.value)}
                rows={5}
                placeholder={t("asymmetric.elgamal.publicPlaceholder")}
              />
              <Textarea
                value={elgamalPrivate}
                onChange={(event) => setElgamalPrivate(event.target.value)}
                rows={5}
                placeholder={t("asymmetric.elgamal.privatePlaceholder")}
              />
            </div>
            <Textarea
              value={elgamalInput}
              onChange={(event) => setElgamalInput(event.target.value)}
              placeholder={t("asymmetric.placeholders.input")}
              rows={5}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleElGamalEncrypt}>
                {t("actions.encrypt")}
              </Button>
              <Button variant="secondary" onClick={handleElGamalDecrypt}>
                {t("actions.decrypt")}
              </Button>
            </div>
            <Textarea
              value={elgamalOutput}
              readOnly
              rows={5}
              placeholder={t("asymmetric.placeholders.output")}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {t("asymmetric.notice")}
      </CardFooter>
    </Card>
  );
}
