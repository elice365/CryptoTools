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
import { Textarea } from "@/components/ui/textarea";
import {
  StreamCipherOptions,
  StreamCipherResult,
  chacha20Decrypt,
  chacha20Encrypt,
  salsa20Decrypt,
  salsa20Encrypt,
} from "@/lib/crypto";

const OUTPUT_ENCODINGS: Array<"hex" | "base64"> = ["hex", "base64"];

type StreamAlgorithm = "chacha20" | "salsa20";

export function StreamTools() {
  const t = useTranslations();
  const [algorithm, setAlgorithm] = useState<StreamAlgorithm>("chacha20");
  const [encoding, setEncoding] = useState<"hex" | "base64">("base64");
  const [useExtendedNonce, setUseExtendedNonce] = useState(false);
  const [key, setKey] = useState("");
  const [nonce, setNonce] = useState("");
  const [counter, setCounter] = useState(0);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const buildOptions = (): StreamCipherOptions => ({
    key,
    nonce: nonce || undefined,
    outputEncoding: encoding,
    counter,
    extendedNonce: useExtendedNonce,
  });

  const handleEncrypt = () => {
    if (!key) {
      toast.error(t("errors.keyRequired"));
      return;
    }
    setIsProcessing(true);
    try {
      let result: StreamCipherResult;
      if (algorithm === "chacha20") {
        result = chacha20Encrypt(input, buildOptions());
      } else {
        result = salsa20Encrypt(input, buildOptions());
      }
      setOutput(result.cipherText);
      if (!nonce && result.nonce) {
        setNonce(result.nonce);
      }
      toast.success(t("stream.actions.encrypted"));
    } catch (error) {
      toast.error(t("errors.encryptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = () => {
    if (!key) {
      toast.error(t("errors.keyRequired"));
      return;
    }
    if (!nonce) {
      toast.error(t("errors.nonceRequired"));
      return;
    }
    setIsProcessing(true);
    try {
      let result: string;
      if (algorithm === "chacha20") {
        result = chacha20Decrypt(input, buildOptions());
      } else {
        result = salsa20Decrypt(input, buildOptions());
      }
      setOutput(result);
      toast.success(t("stream.actions.decrypted"));
    } catch (error) {
      toast.error(t("errors.decryptionFailed"));
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
        <CardTitle>{t("stream.title")}</CardTitle>
        <CardDescription>{t("stream.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="stream-algorithm"
            >
              {t("stream.labels.algorithm")}
            </label>
            <Select
              value={algorithm}
              onValueChange={(value: StreamAlgorithm) => setAlgorithm(value)}
            >
              <SelectTrigger id="stream-algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chacha20">ChaCha20</SelectItem>
                <SelectItem value="salsa20">Salsa20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="stream-encoding"
            >
              {t("stream.labels.encoding")}
            </label>
            <Select
              value={encoding}
              onValueChange={(value: "hex" | "base64") => setEncoding(value)}
            >
              <SelectTrigger id="stream-encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_ENCODINGS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="stream-nonce-mode"
            >
              {t("stream.labels.nonceMode")}
            </label>
            <Select
              value={useExtendedNonce ? "extended" : "standard"}
              onValueChange={(value) =>
                setUseExtendedNonce(value === "extended")
              }
            >
              <SelectTrigger id="stream-nonce-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  {t("stream.nonce.standard")}
                </SelectItem>
                <SelectItem value="extended">
                  {t("stream.nonce.extended")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="stream-key"
            >
              {t("stream.labels.key")}
            </label>
            <Input
              id="stream-key"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder={t("stream.placeholders.key")}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="stream-nonce"
            >
              {t("stream.labels.nonce")}
            </label>
            <Input
              id="stream-nonce"
              value={nonce}
              onChange={(event) => setNonce(event.target.value)}
              placeholder={
                useExtendedNonce
                  ? t("stream.placeholders.nonceExtended")
                  : t("stream.placeholders.nonce")
              }
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="stream-counter"
            >
              {t("stream.labels.counter")}
            </label>
            <Input
              id="stream-counter"
              type="number"
              value={counter}
              onChange={(event) => setCounter(Number(event.target.value))}
            />
          </div>
        </div>

        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("stream.placeholders.input")}
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
          placeholder={t("stream.placeholders.output")}
        />
      </CardFooter>
    </Card>
  );
}
