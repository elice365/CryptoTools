"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, ExternalLink } from "lucide-react";

interface CryptoHelperProps {
  error?: string;
  onRetry?: () => void;
}

export function CryptoHelper({ error, onRetry }: CryptoHelperProps) {
  const isSecurityError = error && (
    error.includes("crypto") ||
    error.includes("보안") ||
    error.includes("HTTPS") ||
    error.includes("subtle") ||
    error.includes("IV")
  );

  const getCurrentUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const getCorrectUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    const currentUrl = new URL(window.location.href);
    return `http://localhost:${currentUrl.port || '3000'}`;
  };

  if (!isSecurityError) {
    return null;
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Web Crypto API 사용 불가
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>문제:</strong> 현재 브라우저 환경에서 암호화 API에 접근할 수 없습니다.
            <br />
            <strong>원인:</strong> Web Crypto API는 보안 컨텍스트(HTTPS 또는 localhost)에서만 사용 가능합니다.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold">🔧 해결 방법:</h4>

          <div className="space-y-2">
            <p className="text-sm">
              <strong>1. localhost로 접속 (권장)</strong>
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm">
              현재 URL: {getCurrentUrl()}
              <br />
              변경할 URL: <span className="text-green-600 font-bold">{getCorrectUrl()}</span>
            </div>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = getCorrectUrl();
                }
              }}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              localhost로 이동
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              <strong>2. 브라우저 확인</strong>
            </p>
            <ul className="text-sm text-muted-foreground ml-4 space-y-1">
              <li>• Chrome, Firefox, Safari, Edge 최신 버전 사용</li>
              <li>• 프라이빗/시크릿 모드에서 테스트</li>
              <li>• 브라우저 확장 프로그램 비활성화</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              <strong>3. 개발자 도구 진단</strong>
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm mb-2">F12 → Console에서 실행:</p>
              <code className="text-xs">
                console.log(&#123;
                <br />
                &nbsp;&nbsp;url: location.href,
                <br />
                &nbsp;&nbsp;isSecure: isSecureContext,
                <br />
                &nbsp;&nbsp;crypto: !!crypto,
                <br />
                &nbsp;&nbsp;subtle: !!crypto?.subtle
                <br />
                &#125;);
              </code>
            </div>
          </div>

          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="w-full">
              다시 시도
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}