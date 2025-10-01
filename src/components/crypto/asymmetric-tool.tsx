"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  AsymmetricCrypto,
  type AsymmetricAlgorithm,
} from "@/lib/crypto/asymmetric";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function AsymmetricTool() {
  const t = useTranslations();
  const [algorithm, setAlgorithm] = useState<AsymmetricAlgorithm>("rsa");
  const [keySize, setKeySize] = useState(2048);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [operation, setOperation] = useState<
    "encrypt" | "decrypt" | "sign" | "verify"
  >("encrypt");
  const [signature, setSignature] = useState("");

  const algorithms: { value: AsymmetricAlgorithm; label: string }[] = [
    { value: "rsa", label: "RSA" },
    { value: "ecc", label: "ECC (ECDSA)" },
  ];

  const keySizes = [1024, 2048, 3072, 4096];

  const handleGenerateKeyPair = useCallback(async () => {
    try {
      let keyPair;

      if (algorithm === "rsa") {
        keyPair = await AsymmetricCrypto.generateRSAKeyPair(keySize);
      } else if (algorithm === "ecc") {
        keyPair = await AsymmetricCrypto.generateECDSAKeyPair("P-256");
      } else {
        throw new Error(`${t("asymmetric.errors.unsupportedAlgorithm")}: ${algorithm}`);
      }

      setPublicKey(keyPair.publicKey);
      setPrivateKey(keyPair.privateKey);

      toast.success(t("errors.keyPairGenerated"));
    } catch (error) {
      toast.error(
        `${t("errors.keyGenerationFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [algorithm, keySize, t]);

  const handleEncrypt = useCallback(async () => {
    try {
      if (!input.trim()) {
        toast.error(t("errors.inputRequired"));
        return;
      }

      if (!publicKey) {
        toast.error(t("errors.publicKeyRequired"));
        return;
      }

      if (algorithm !== "rsa") {
        toast.error(t("errors.rsaOnly"));
        return;
      }

      const result = await AsymmetricCrypto.encryptRSA(input, publicKey);
      setOutput(result);

      toast.success(t("asymmetric.rsa.encrypted"));
    } catch (error) {
      toast.error(
        `${t("errors.encryptionFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [input, publicKey, algorithm, t]);

  const handleDecrypt = useCallback(async () => {
    try {
      if (!input.trim()) {
        toast.error(t("errors.inputRequired"));
        return;
      }

      if (!privateKey) {
        toast.error(t("errors.privateKeyRequired"));
        return;
      }

      if (algorithm !== "rsa") {
        toast.error(t("errors.rsaOnly"));
        return;
      }

      const result = await AsymmetricCrypto.decryptRSA(input, privateKey);
      setOutput(result);

      toast.success(t("asymmetric.rsa.decrypted"));
    } catch (error) {
      toast.error(
        `${t("errors.decryptionFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [input, privateKey, algorithm, t]);

  const handleSign = useCallback(async () => {
    try {
      if (!input.trim()) {
        toast.error(t("errors.messageRequired"));
        return;
      }

      if (!privateKey) {
        toast.error(t("errors.privateKeyRequired"));
        return;
      }

      let result: string;

      if (algorithm === "rsa") {
        result = await AsymmetricCrypto.signRSA(input, privateKey);
      } else if (algorithm === "ecc") {
        result = await AsymmetricCrypto.signECDSA(input, privateKey);
      } else {
        throw new Error(`${t("asymmetric.errors.unsupportedAlgorithm")}: ${algorithm}`);
      }

      setSignature(result);
      setOutput(result);

      toast.success(t("errors.signatureGenerated"));
    } catch (error) {
      toast.error(
        `${t("errors.signingFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [input, privateKey, algorithm, t]);

  const handleVerify = useCallback(async () => {
    try {
      if (!input.trim()) {
        toast.error(t("errors.messageRequired"));
        return;
      }

      if (!signature.trim()) {
        toast.error(t("errors.signatureRequired"));
        return;
      }

      if (!publicKey) {
        toast.error(t("errors.publicKeyRequired"));
        return;
      }

      if (algorithm !== "ecc") {
        toast.error(t("errors.ecdsaOnly"));
        return;
      }

      const isValid = await AsymmetricCrypto.verifyECDSA(
        input,
        signature,
        publicKey,
      );

      if (isValid) {
        toast.success(t("errors.signatureValid"));
        setOutput(t("asymmetric.alerts.verificationSuccess"));
      } else {
        toast.error(t("errors.signatureInvalid"));
        setOutput(t("asymmetric.alerts.verificationFailed"));
      }
    } catch (error) {
      toast.error(
        `${t("errors.verificationFailed")}: ${error instanceof Error ? error.message : t("base64.errors.unknownError")}`,
      );
    }
  }, [input, signature, publicKey, algorithm, t]);

  const handleOperation = useCallback(async () => {
    switch (operation) {
      case "encrypt":
        await handleEncrypt();
        break;
      case "decrypt":
        await handleDecrypt();
        break;
      case "sign":
        await handleSign();
        break;
      case "verify":
        await handleVerify();
        break;
    }
  }, [operation, handleEncrypt, handleDecrypt, handleSign, handleVerify]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("messages.copied"));
    } catch (error) {
      toast.error(t("errors.copyFailed"));
    }
  }, [t]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setSignature("");
  }, []);

  const handleClearKeys = useCallback(() => {
    setPublicKey("");
    setPrivateKey("");
  }, []);

  const analyzeKey = useCallback((keyPem: string) => {
    if (!keyPem) return null;
    return AsymmetricCrypto.analyzeKey(keyPem);
  }, []);

  const publicKeyInfo = analyzeKey(publicKey);
  const privateKeyInfo = analyzeKey(privateKey);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("asymmetric.title")}</CardTitle>
        <CardDescription>{t("asymmetric.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="keygen" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keygen">{t("asymmetric.tabs.keyManagement")}</TabsTrigger>
            <TabsTrigger value="operations">{t("asymmetric.tabs.cryptoOperations")}</TabsTrigger>
          </TabsList>

          <TabsContent value="keygen" className="space-y-4">
            {/* 키 생성 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.algorithm")}
                </label>
                <Select
                  value={algorithm}
                  onValueChange={(value: AsymmetricAlgorithm) =>
                    setAlgorithm(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithms.map((algo) => (
                      <SelectItem key={algo.value} value={algo.value}>
                        {algo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {algorithm === "rsa" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("asymmetric.labels.keySizeBits")}</label>
                  <Select
                    value={keySize.toString()}
                    onValueChange={(value) => setKeySize(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {keySizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {t("common.bits")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* 키 생성 버튼 */}
            <div className="flex gap-2">
              <Button onClick={handleGenerateKeyPair}>
                {t("asymmetric.keyGeneration")}
              </Button>
              <Button variant="outline" onClick={handleClearKeys}>
                {t("asymmetric.actions.clearKeys")}
              </Button>
            </div>

            {/* 공개키 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {t("asymmetric.publicKey")}
                </label>
                {publicKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(publicKey)}
                  >
                    {t("common.copy")}
                  </Button>
                )}
              </div>
              <Textarea
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder={t("asymmetric.placeholders.publicKey")}
                className="min-h-[120px] font-mono text-xs"
              />
              {publicKeyInfo && (
                <div className="text-xs text-muted-foreground">
                  {t("asymmetric.labels.type")}: {publicKeyInfo.type} | {t("common.algorithm")}:{" "}
                  {publicKeyInfo.algorithm} | {t("asymmetric.labels.valid")}:{" "}
                  {publicKeyInfo.isValid ? "✅" : "❌"}
                </div>
              )}
            </div>

            {/* 개인키 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {t("asymmetric.privateKey")}
                </label>
                {privateKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(privateKey)}
                  >
                    {t("common.copy")}
                  </Button>
                )}
              </div>
              <Textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder={t("asymmetric.placeholders.privateKey")}
                className="min-h-[120px] font-mono text-xs"
              />
              {privateKeyInfo && (
                <div className="text-xs text-muted-foreground">
                  {t("asymmetric.labels.type")}: {privateKeyInfo.type} | {t("common.algorithm")}:{" "}
                  {privateKeyInfo.algorithm} | {t("asymmetric.labels.valid")}:{" "}
                  {privateKeyInfo.isValid ? "✅" : "❌"}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            {/* 작업 선택 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant={operation === "encrypt" ? "default" : "outline"}
                onClick={() => setOperation("encrypt")}
              >
                {t("common.encrypt")}
              </Button>
              <Button
                variant={operation === "decrypt" ? "default" : "outline"}
                onClick={() => setOperation("decrypt")}
              >
                {t("common.decrypt")}
              </Button>
              <Button
                variant={operation === "sign" ? "default" : "outline"}
                onClick={() => setOperation("sign")}
              >
                {t("asymmetric.actions.sign")}
              </Button>
              <Button
                variant={operation === "verify" ? "default" : "outline"}
                onClick={() => setOperation("verify")}
              >
                {t("common.verify")}
              </Button>
            </div>

            {/* 입력 텍스트 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {operation === "encrypt" && t("asymmetric.labels.plaintext")}
                {operation === "decrypt" && t("asymmetric.labels.ciphertext")}
                {operation === "sign" && t("asymmetric.labels.messageToSign")}
                {operation === "verify" && t("asymmetric.labels.messageToVerify")}
              </label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`${operation === "encrypt" ? t("asymmetric.placeholders.textToEncrypt") : operation === "decrypt" ? t("asymmetric.placeholders.textToDecrypt") : operation === "sign" ? t("asymmetric.placeholders.textToSign") : t("asymmetric.placeholders.textToVerify")}...`}
                className="min-h-[120px] font-mono"
              />
            </div>

            {/* 서명 입력 (검증 시에만) */}
            {operation === "verify" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("asymmetric.labels.signature")}</label>
                <Textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={t("asymmetric.placeholders.signatureToVerify")}
                  className="min-h-[80px] font-mono"
                />
              </div>
            )}

            {/* 실행 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={handleOperation}
                disabled={
                  !input.trim() || (operation === "verify" && !signature.trim())
                }
              >
                {operation === "encrypt" && t("common.encrypt")}
                {operation === "decrypt" && t("common.decrypt")}
                {operation === "sign" && t("asymmetric.actions.generateSignature")}
                {operation === "verify" && t("asymmetric.actions.verifySignature")}
              </Button>
              <Button variant="outline" onClick={handleClear}>
                {t("common.clear")}
              </Button>
            </div>

            {/* 결과 출력 */}
            {output && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.result")}</label>
                <Textarea
                  value={output}
                  readOnly
                  className="min-h-[120px] font-mono bg-muted text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(output)}
                  >
                    {t("common.copy")}
                  </Button>
                </div>
              </div>
            )}

            {/* 알고리즘 정보 */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{t("asymmetric.labels.algorithmInfo")}</h4>
              <div className="text-sm space-y-1">
                {algorithm === "rsa" && (
                  <>
                    <p>
                      <strong>RSA:</strong> {t("asymmetric.info.rsa.description")}
                    </p>
                    <p>
                      <strong>{t("asymmetric.info.usage")}:</strong> {t("asymmetric.info.rsa.usage")}
                    </p>
                    <p>
                      <strong>{t("asymmetric.info.keySize")}:</strong> {keySize} {t("common.bits")}
                    </p>
                    <p>
                      <strong>{t("asymmetric.info.security")}:</strong> {t("asymmetric.info.rsa.security")}
                    </p>
                  </>
                )}
                {algorithm === "ecc" && (
                  <>
                    <p>
                      <strong>ECC/ECDSA:</strong> {t("asymmetric.info.ecc.description")}
                    </p>
                    <p>
                      <strong>{t("asymmetric.info.usage")}:</strong> {t("asymmetric.info.ecc.usage")}
                    </p>
                    <p>
                      <strong>{t("asymmetric.info.curve")}:</strong> P-256
                    </p>
                    <p>
                      <strong>{t("asymmetric.info.security")}:</strong> {t("asymmetric.info.ecc.security")}
                    </p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
