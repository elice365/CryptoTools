"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 에러 로깅
    logger.error("Error boundary caught an error", error);
    console.error("Error Info:", errorInfo);

    // 사용자 정의 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === "production") {
      // Sentry, LogRocket 등으로 에러 전송
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 에러 리포팅 로직
    console.error("Reporting error to service:", { error, errorInfo });
  };

  private resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
          <CardDescription>
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>오류 정보</AlertTitle>
            <AlertDescription className="font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>

          {isDevelopment && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                개발자 정보 (개발 모드에서만 표시)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline" className="flex-1">
              다시 시도
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              페이지 새로고침
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 암호화 작업 전용 에러 바운더리
export function CryptoErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={CryptoErrorFallback}
      onError={(error, errorInfo) => {
        logger.error("Crypto operation error", error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function CryptoErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTitle>암호화 작업 중 오류가 발생했습니다</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        <div className="flex gap-2">
          <Button onClick={resetError} variant="outline" size="sm">
            다시 시도
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
