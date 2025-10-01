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
import { Textarea } from "@/components/ui/textarea";
import {
  base64ToBlob,
  base64ToString,
  fileToBase64,
  isLikelyBase64,
  stringToBase64,
  urlDecode,
  urlEncode,
} from "@/lib/crypto";
import { CryptoError } from "@/lib/utils";

export function EncodingTools() {
  const t = useTranslations();
  const [textInput, setTextInput] = useState("");
  const [base64Result, setBase64Result] = useState("");
  const [urlResult, setUrlResult] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/png");
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("messages.copied"));
    } catch (error) {
      toast.error(t("errors.copyFailed"));
    }
  };

  const handleBase64Encode = () => {
    try {
      if (!textInput.trim()) {
        toast.error(t("errors.inputRequired"));
        return;
      }
      const encoded = stringToBase64(textInput);
      setBase64Result(encoded);
      toast.success(t("encoding.actions.base64Encoded"));
    } catch (error) {
      toast.error(t("errors.encodingFailed"));
    }
  };

  const handleBase64Decode = () => {
    try {
      if (!textInput.trim()) {
        toast.error(t("base64.errors.base64Required"));
        return;
      }
      const decoded = base64ToString(textInput.trim());
      setBase64Result(decoded);
      toast.success(t("encoding.actions.base64Decoded"));
    } catch (error) {
      toast.error(t("errors.decodingFailed"));
    }
  };

  const handleUrlEncode = () => {
    try {
      if (!textInput.trim()) {
        toast.error(t("errors.inputRequired"));
        return;
      }
      setUrlResult(urlEncode(textInput));
      toast.success(t("encoding.actions.urlEncoded"));
    } catch (error) {
      toast.error(t("errors.encodingFailed"));
    }
  };

  const handleUrlDecode = () => {
    try {
      if (!textInput.trim()) {
        toast.error(t("errors.inputRequired"));
        return;
      }
      setUrlResult(urlDecode(textInput));
      toast.success(t("encoding.actions.urlDecoded"));
    } catch (error) {
      toast.error(t("errors.decodingFailed"));
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setIsImageLoading(true);
    try {
      const { base64, mime } = await fileToBase64(file);
      setImageBase64(base64);
      setImageMime(mime);
      setImagePreview(`data:${mime};base64,${base64}`);
      toast.success(t("encoding.actions.imageEncoded"));
    } catch (error) {
      toast.error(t("errors.imageProcessingFailed"));
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleBase64ToImage = () => {
    if (!isLikelyBase64(textInput)) {
      toast.error(t("errors.invalidBase64"));
      return;
    }
    try {
      const blob = base64ToBlob(textInput.trim(), imageMime);
      const url = URL.createObjectURL(blob);
      setImagePreview(url);
      setImageBase64(textInput.trim());
      toast.success(t("encoding.actions.imageDecoded"));
    } catch (error) {
      const message =
        error instanceof CryptoError
          ? error.message
          : t("errors.imageProcessingFailed");
      toast.error(message);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{t("encoding.cards.base64.title")}</CardTitle>
          <CardDescription>
            {t("encoding.cards.base64.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder={t("encoding.cards.base64.placeholder")}
            rows={6}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBase64Encode}>{t("actions.encode")}</Button>
            <Button variant="secondary" onClick={handleBase64Decode}>
              {t("actions.decode")}
            </Button>
            <Button variant="outline" onClick={() => handleCopy(base64Result)}>
              {t("actions.copy")}
            </Button>
            <Button variant="ghost" onClick={() => setBase64Result("")}>
              {t("actions.clear")}
            </Button>
          </div>
          <Textarea
            value={base64Result}
            readOnly
            rows={6}
            placeholder={t("encoding.cards.base64.resultPlaceholder")}
          />
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>{t("encoding.cards.url.title")}</CardTitle>
          <CardDescription>
            {t("encoding.cards.url.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder={t("encoding.cards.url.placeholder")}
            rows={6}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleUrlEncode}>{t("actions.encode")}</Button>
            <Button variant="secondary" onClick={handleUrlDecode}>
              {t("actions.decode")}
            </Button>
            <Button variant="outline" onClick={() => handleCopy(urlResult)}>
              {t("actions.copy")}
            </Button>
            <Button variant="ghost" onClick={() => setUrlResult("")}>
              {t("actions.clear")}
            </Button>
          </div>
          <Textarea
            value={urlResult}
            readOnly
            rows={6}
            placeholder={t("encoding.cards.url.resultPlaceholder")}
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t("encoding.cards.image.title")}</CardTitle>
          <CardDescription>
            {t("encoding.cards.image.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleImageUpload(event.target.files?.[0] ?? null)
              }
            />
            <Button
              variant="secondary"
              disabled={isImageLoading}
              onClick={handleBase64ToImage}
            >
              {t("encoding.cards.image.decodeButton")}
            </Button>
            {imageBase64 && (
              <Button variant="outline" onClick={() => handleCopy(imageBase64)}>
                {t("actions.copy")}
              </Button>
            )}
          </div>
          {imagePreview && (
            <div className="flex flex-col gap-2">
              <img
                src={imagePreview}
                alt={t("encoding.cards.image.previewAlt")}
                className="max-h-80 w-full rounded-lg border object-contain"
              />
              {imageBase64 && (
                <Textarea
                  value={imageBase64}
                  readOnly
                  rows={6}
                  placeholder={t("encoding.cards.image.resultPlaceholder")}
                />
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          {imageBase64 && (
            <Button
              variant="secondary"
              onClick={() => {
                if (!imageBase64) return;
                const blob = base64ToBlob(imageBase64, imageMime);
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `image.${imageMime.split("/")[1] ?? "png"}`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t("actions.download")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
