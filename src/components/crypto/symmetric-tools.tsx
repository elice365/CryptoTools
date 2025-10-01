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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AesMode,
  PaddingScheme,
  SymmetricResult,
  aesDecrypt,
  aesEncrypt,
  chacha20Decrypt,
  chacha20Encrypt,
  desDecrypt,
  desEncrypt,
  rabbitDecrypt,
  rabbitEncrypt,
  rc4Decrypt,
  rc4Encrypt,
  salsa20Decrypt,
  salsa20Encrypt,
  tripleDesDecrypt,
  tripleDesEncrypt,
} from "@/lib/crypto";
import { CryptoError } from "@/lib/utils";

const AES_MODES: AesMode[] = ["gcm", "cbc", "ctr", "cfb", "ecb"];
const AES_KEY_LENGTHS: Array<128 | 192 | 256> = [128, 192, 256];
const PADDING_SCHEMES: PaddingScheme[] = [
  "pkcs7",
  "ansix923",
  "iso10126",
  "nopadding",
];

const CIPHER_ENCODINGS: Array<"hex" | "base64"> = ["hex", "base64"];

type SymmetricAlgorithm =
  | "aes"
  | "des"
  | "3des"
  | "rc4"
  | "rabbit"
  | "chacha20"
  | "salsa20";

export function SymmetricTools() {
  const t = useTranslations();
  const [algorithm, setAlgorithm] = useState<SymmetricAlgorithm>("aes");
  const [mode, setMode] = useState<AesMode>("gcm");
  const [keyLength, setKeyLength] = useState<128 | 192 | 256>(256);
  const [padding, setPadding] = useState<PaddingScheme>("pkcs7");
  const [cipherEncoding, setCipherEncoding] = useState<"hex" | "base64">(
    "base64",
  );
  const [key, setKey] = useState("");
  const [iv, setIv] = useState("");
  const [nonce, setNonce] = useState("");
  const [aad, setAad] = useState("");
  const [rc4Drop, setRc4Drop] = useState(768);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const requiresIv = useMemo(() => {
    if (algorithm === "aes") {
      return mode !== "ecb";
    }
    if (algorithm === "des" || algorithm === "3des") {
      return true;
    }
    return false;
  }, [algorithm, mode]);

  const requiresNonce = useMemo(() => {
    return algorithm === "chacha20" || algorithm === "salsa20";
  }, [algorithm]);

  const supportsPadding = useMemo(() => {
    if (algorithm === "aes") {
      return mode !== "gcm" && mode !== "ctr";
    }
    if (algorithm === "des" || algorithm === "3des") {
      return true;
    }
    return false;
  }, [algorithm, mode]);

  const handleEncrypt = async () => {
    if (!key) {
      toast.error(t("errors.keyRequired"));
      return;
    }
    setIsProcessing(true);
    try {
      let result: SymmetricResult | null = null;
      if (algorithm === "aes") {
        const aesResult = await aesEncrypt(input, {
          key,
          keyLength,
          mode,
          iv: requiresIv ? iv : undefined,
          outputEncoding: cipherEncoding,
          aad: mode === "gcm" && aad ? aad : undefined,
          padding: supportsPadding ? padding : undefined,
        });
        result = aesResult;
        if (!iv && aesResult.iv) {
          setIv(aesResult.iv);
        }
      } else if (algorithm === "des") {
        result = await desEncrypt(input, {
          key,
          iv: requiresIv ? iv : undefined,
          outputEncoding: cipherEncoding,
          mode: "cbc",
          padding: supportsPadding ? padding : undefined,
        });
        if (!iv && result.iv) {
          setIv(result.iv);
        }
      } else if (algorithm === "3des") {
        result = await tripleDesEncrypt(input, {
          key,
          iv: requiresIv ? iv : undefined,
          outputEncoding: cipherEncoding,
          mode: "cbc",
          padding: supportsPadding ? padding : undefined,
        });
        if (!iv && result.iv) {
          setIv(result.iv);
        }
      } else if (algorithm === "rc4") {
        result = await rc4Encrypt(input, {
          key,
          outputEncoding: cipherEncoding,
          drop: rc4Drop,
        });
      } else if (algorithm === "rabbit") {
        result = await rabbitEncrypt(input, {
          key,
          outputEncoding: cipherEncoding,
        });
      } else if (algorithm === "chacha20") {
        result = await chacha20Encrypt(input, {
          key,
          nonce: nonce || undefined,
          outputEncoding: cipherEncoding,
        });
        if (!nonce && result.nonce) {
          setNonce(result.nonce);
        }
      } else if (algorithm === "salsa20") {
        result = await salsa20Encrypt(input, {
          key,
          nonce: nonce || undefined,
          outputEncoding: cipherEncoding,
        });
        if (!nonce && result.nonce) {
          setNonce(result.nonce);
        }
      }

      if (result) {
        setOutput(result.cipherText);
        toast.success(t("symmetric.actions.encrypted"));
      }
    } catch (error) {
      const message =
        error instanceof CryptoError
          ? error.message
          : t("errors.encryptionFailed");
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!key) {
      toast.error(t("errors.keyRequired"));
      return;
    }
    setIsProcessing(true);
    try {
      let result = "";
      if (algorithm === "aes") {
        result = await aesDecrypt(input, {
          key,
          keyLength,
          mode,
          iv: requiresIv ? iv : undefined,
          outputEncoding: cipherEncoding,
          aad: mode === "gcm" && aad ? aad : undefined,
          padding: supportsPadding ? padding : undefined,
        });
      } else if (algorithm === "des") {
        result = await desDecrypt(input, {
          key,
          iv: requiresIv ? iv : undefined,
          outputEncoding: cipherEncoding,
          mode: "cbc",
          padding: supportsPadding ? padding : undefined,
        });
      } else if (algorithm === "3des") {
        result = await tripleDesDecrypt(input, {
          key,
          iv: requiresIv ? iv : undefined,
          outputEncoding: cipherEncoding,
          mode: "cbc",
          padding: supportsPadding ? padding : undefined,
        });
      } else if (algorithm === "rc4") {
        result = await rc4Decrypt(input, {
          key,
          outputEncoding: cipherEncoding,
          drop: rc4Drop,
        });
      } else if (algorithm === "rabbit") {
        result = await rabbitDecrypt(input, {
          key,
          outputEncoding: cipherEncoding,
        });
      } else if (algorithm === "chacha20") {
        result = await chacha20Decrypt(input, {
          key,
          nonce,
          outputEncoding: cipherEncoding,
        });
      } else if (algorithm === "salsa20") {
        result = await salsa20Decrypt(input, {
          key,
          nonce,
          outputEncoding: cipherEncoding,
        });
      }
      setOutput(result);
      toast.success(t("symmetric.actions.decrypted"));
    } catch (error) {
      const message =
        error instanceof CryptoError
          ? error.message
          : t("errors.decryptionFailed");
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success(t("messages.copied"));
    } catch (error) {
      toast.error(t("errors.copyFailed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("symmetric.title")}</CardTitle>
        <CardDescription>{t("symmetric.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="symmetric-algorithm"
            >
              {t("symmetric.labels.algorithm")}
            </label>
            <Select
              value={algorithm}
              onValueChange={(value: SymmetricAlgorithm) => setAlgorithm(value)}
            >
              <SelectTrigger id="symmetric-algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aes">AES</SelectItem>
                <SelectItem value="des">DES</SelectItem>
                <SelectItem value="3des">3DES</SelectItem>
                <SelectItem value="rc4">RC4</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="chacha20">ChaCha20</SelectItem>
                <SelectItem value="salsa20">Salsa20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="cipher-encoding"
            >
              {t("symmetric.labels.outputEncoding")}
            </label>
            <Select
              value={cipherEncoding}
              onValueChange={(value: "hex" | "base64") =>
                setCipherEncoding(value)
              }
            >
              <SelectTrigger id="cipher-encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CIPHER_ENCODINGS.map((encodingOption) => (
                  <SelectItem key={encodingOption} value={encodingOption}>
                    {encodingOption.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {algorithm === "aes" && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="aes-mode"
              >
                {t("symmetric.labels.mode")}
              </label>
              <Select
                value={mode}
                onValueChange={(value: AesMode) => setMode(value)}
              >
                <SelectTrigger id="aes-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AES_MODES.map((modeOption) => (
                    <SelectItem key={modeOption} value={modeOption}>
                      {modeOption.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {algorithm === "aes" && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="aes-key-length"
              >
                {t("symmetric.labels.keyLength")}
              </label>
              <Select
                value={String(keyLength) as "128" | "192" | "256"}
                onValueChange={(value) =>
                  setKeyLength(Number(value) as 128 | 192 | 256)
                }
              >
                <SelectTrigger id="aes-key-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AES_KEY_LENGTHS.map((length) => (
                    <SelectItem key={length} value={String(length)}>
                      {length} bit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {supportsPadding && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="padding-scheme"
              >
                {t("symmetric.labels.padding")}
              </label>
              <Select
                value={padding}
                onValueChange={(value: PaddingScheme) => setPadding(value)}
              >
                <SelectTrigger id="padding-scheme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PADDING_SCHEMES.map((paddingOption) => (
                    <SelectItem key={paddingOption} value={paddingOption}>
                      {paddingOption.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {algorithm === "rc4" && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="rc4-drop"
              >
                {t("symmetric.labels.rc4Drop")}
              </label>
              <Input
                id="rc4-drop"
                type="number"
                value={rc4Drop}
                onChange={(event) => setRc4Drop(Number(event.target.value))}
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="symmetric-key"
            >
              {t("symmetric.labels.key")}
            </label>
            <Input
              id="symmetric-key"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder={t("symmetric.placeholders.key")}
            />
          </div>
          {requiresIv && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="symmetric-iv"
              >
                {t("symmetric.labels.iv")}
              </label>
              <Input
                id="symmetric-iv"
                value={iv}
                onChange={(event) => setIv(event.target.value)}
                placeholder={t("symmetric.placeholders.iv")}
              />
            </div>
          )}
          {requiresNonce && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="symmetric-nonce"
              >
                {t("symmetric.labels.nonce")}
              </label>
              <Input
                id="symmetric-nonce"
                value={nonce}
                onChange={(event) => setNonce(event.target.value)}
                placeholder={t("symmetric.placeholders.nonce")}
              />
            </div>
          )}
          {algorithm === "aes" && mode === "gcm" && (
            <div className="space-y-2 md:col-span-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="symmetric-aad"
              >
                {t("symmetric.labels.aad")}
              </label>
              <Input
                id="symmetric-aad"
                value={aad}
                onChange={(event) => setAad(event.target.value)}
                placeholder={t("symmetric.placeholders.aad")}
              />
            </div>
          )}
        </div>

        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("symmetric.placeholders.input")}
          rows={6}
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleEncrypt} disabled={isProcessing}>
            {isProcessing ? t("actions.processing") : t("actions.encrypt")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDecrypt}
            disabled={isProcessing}
          >
            {isProcessing ? t("actions.processing") : t("actions.decrypt")}
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={!output}>
            {t("actions.copy")}
          </Button>
          <Button variant="ghost" onClick={() => setOutput("")}>
            {t("actions.clear")}
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Textarea
          value={output}
          readOnly
          rows={6}
          placeholder={t("symmetric.placeholders.output")}
        />
      </CardFooter>
    </Card>
  );
}
