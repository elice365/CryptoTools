"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Web Worker imports
import { cryptoWorkerManager } from "@/lib/workers/crypto-worker-manager";

// Fallback imports (for when workers are not available)
import {
  generatePaillierKeyPairWithProgress,
  paillierEncrypt,
  paillierDecrypt,
  createVotingDemo,
  tallyVotes,
  createCalculatorDemo,
  addEncryptedNumbers,
  multiplyEncryptedByPlaintext,
  benchmarkPaillierOperations,
  type PaillierKeyPair,
  type PaillierCiphertext,
  type VotingDemo,
  type CalculatorDemo,
} from "@/lib/crypto/paillier";

// BGV fallback imports
import {
  generateBgvKeyPairWithProgress,
  encryptText as bgvEncryptText,
  decryptToText as bgvDecryptToText,
  createEncryptedDatabase,
  queryEncryptedDatabase,
  createBgvCalculatorDemo,
  addEncryptedBgvNumbers,
  multiplyEncryptedBgvNumbers,
  benchmarkBgvOperations,
  analyzeBgvSecurity,
  optimizeBgvForBrowser,
  BGV_PARAMETER_SETS,
  type BgvKeyPair,
  type BgvCiphertext,
  type EncryptedDatabase,
  type BgvCalculatorDemo,
  type BgvSecurityAnalysis,
} from "@/lib/crypto/bgv";

type CryptoSystem = "paillier" | "bgv";

export function AdvancedCryptoTools() {
  const t = useTranslations();
  const [system, setSystem] = useState<CryptoSystem>("paillier");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [useWebWorkers, setUseWebWorkers] = useState(true);
  const [workerSupported, setWorkerSupported] = useState(false);

  // Paillier state
  const [paillierKeys, setPaillierKeys] = useState<PaillierKeyPair | null>(null);
  const [paillierInput, setPaillierInput] = useState("");
  const [paillierResult, setPaillierResult] = useState("");

  // BGV state
  const [bgvKeys, setBgvKeys] = useState<BgvKeyPair | null>(null);
  const [bgvInput, setBgvInput] = useState("");
  const [bgvResult, setBgvResult] = useState("");
  const [bgvParameterSet, setBgvParameterSet] = useState<keyof typeof BGV_PARAMETER_SETS>("small");
  const [securityAnalysis, setSecurityAnalysis] = useState<BgvSecurityAnalysis | null>(null);

  // Check Web Worker support on mount
  useEffect(() => {
    const supported = cryptoWorkerManager.isWorkerSupported();
    setWorkerSupported(supported);
    if (!supported) {
      setUseWebWorkers(false);
      console.warn("Web Workers not supported, falling back to main thread operations");
    }
  }, []);

  const handleGenerateKeys = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage("");

    try {
      if (system === "paillier") {
        if (useWebWorkers && workerSupported) {
          // Use Web Worker for Paillier key generation
          const keyPair = await cryptoWorkerManager.generatePaillierKeys(
            2048,
            (prog, msg) => {
              setProgress(prog * 100);
              setProgressMessage(msg || "");
            }
          );
          setPaillierKeys(keyPair as PaillierKeyPair);
          toast.success("Paillier keys generated successfully (Web Worker)");
        } else {
          // Fallback to main thread
          const keyPair = await generatePaillierKeyPairWithProgress(
            2048,
            true,
            (prog, msg) => {
              setProgress(prog * 100);
              setProgressMessage(msg || "");
            }
          );
          setPaillierKeys(keyPair);
          toast.success("Paillier keys generated successfully (Main Thread)");
        }
      } else {
        if (useWebWorkers && workerSupported) {
          // Use Web Worker for BGV key generation
          const keyPair = await cryptoWorkerManager.generateBgvKeys(
            bgvParameterSet,
            (prog, msg) => {
              setProgress(prog * 100);
              setProgressMessage(msg || "");
            }
          );
          setBgvKeys(keyPair as BgvKeyPair);

          // Generate security analysis
          const params = BGV_PARAMETER_SETS[bgvParameterSet];
          const analysis = analyzeBgvSecurity(params);
          setSecurityAnalysis(analysis);

          toast.success("BGV keys generated successfully (Web Worker)");
        } else {
          // Fallback to main thread
          const params = BGV_PARAMETER_SETS[bgvParameterSet];
          const keyPair = await generateBgvKeyPairWithProgress(
            params,
            (prog, msg) => {
              setProgress(prog * 100);
              setProgressMessage(msg || "");
            }
          );
          setBgvKeys(keyPair);

          // Generate security analysis
          const analysis = analyzeBgvSecurity(params);
          setSecurityAnalysis(analysis);

          toast.success("BGV keys generated successfully (Main Thread)");
        }
      }
    } catch (error) {
      toast.error(`Key generation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleBasicEncryption = async () => {
    if (!paillierInput.trim()) {
      toast.error("Please enter text to encrypt");
      return;
    }

    setIsProcessing(true);
    try {
      if (system === "paillier" && paillierKeys) {
        const encrypted = paillierEncrypt(paillierKeys.publicKey, paillierInput);
        const decrypted = paillierDecrypt(paillierKeys.privateKey, encrypted);
        setPaillierResult(`Encrypted: ${encrypted.value.slice(0, 50)}...\nDecrypted: ${decrypted}`);
        toast.success("Paillier encryption completed");
      } else if (system === "bgv" && bgvKeys) {
        const encrypted = bgvEncryptText(bgvKeys.publicKey, bgvInput, bgvKeys.params);
        const decrypted = bgvDecryptToText(bgvKeys.secretKey, encrypted, bgvKeys.params);
        setBgvResult(`Original: ${bgvInput}\nDecrypted: ${decrypted}`);
        toast.success("BGV encryption completed");
      } else {
        toast.error("Please generate keys first");
      }
    } catch (error) {
      toast.error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVotingDemo = async () => {
    if (!paillierKeys) {
      toast.error("Please generate Paillier keys first");
      return;
    }

    setIsProcessing(true);
    try {
      const candidates = ["Alice", "Bob", "Charlie"];
      const votes = [0, 0, 1, 0, 1]; // Sample votes

      const votingDemo = await createVotingDemo(candidates, votes, paillierKeys);
      const results = tallyVotes(votingDemo, paillierKeys.privateKey);

      const resultText = results
        .map(r => `${r.candidate}: ${r.votes} votes`)
        .join("\n");

      setPaillierResult(`Voting Results:\n${resultText}`);
      toast.success("Encrypted voting demo completed");
    } catch (error) {
      toast.error(`Voting demo failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCalculatorDemo = async () => {
    const keys = system === "paillier" ? paillierKeys : bgvKeys;
    if (!keys) {
      toast.error("Please generate keys first");
      return;
    }

    setIsProcessing(true);
    try {
      const numbers = ["10", "20", "5"];

      if (system === "paillier" && paillierKeys) {
        const calc = createCalculatorDemo(numbers, paillierKeys.publicKey);
        const addResult = addEncryptedNumbers(calc, paillierKeys.privateKey);
        const mulResult = multiplyEncryptedByPlaintext(
          calc.operands[0],
          "3",
          paillierKeys.publicKey,
          paillierKeys.privateKey
        );

        setPaillierResult(`Addition Result: ${addResult.decrypted}\nMultiplication (first * 3): ${mulResult.decrypted}`);
      } else if (system === "bgv" && bgvKeys) {
        const calc = createBgvCalculatorDemo(numbers, bgvKeys.publicKey, bgvKeys.params);
        const addResult = addEncryptedBgvNumbers(calc, bgvKeys.secretKey);
        const mulResult = multiplyEncryptedBgvNumbers(calc, bgvKeys.secretKey);

        setBgvResult(`Addition Result: ${addResult.decrypted}\nMultiplication Result: ${mulResult.decrypted}`);
      }

      toast.success("Calculator demo completed");
    } catch (error) {
      toast.error(`Calculator demo failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBenchmark = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage("");

    try {
      if (system === "paillier") {
        let results: any;
        if (useWebWorkers && workerSupported) {
          // Use Web Worker for benchmarking
          results = await cryptoWorkerManager.paillierBenchmark(
            2048,
            5,
            (prog, msg) => {
              setProgress(prog * 100);
              setProgressMessage(msg || "");
            }
          );
          toast.success("Paillier benchmark completed (Web Worker)");
        } else {
          // Fallback to main thread
          results = await benchmarkPaillierOperations(2048, 5);
          toast.success("Paillier benchmark completed (Main Thread)");
        }

        const benchmarkText = `Paillier Benchmark Results:
Key Generation: ${results.keyGeneration.toFixed(2)}ms
Encryption: ${results.encryption.toFixed(2)}ms
Decryption: ${results.decryption.toFixed(2)}ms
Addition: ${results.addition.toFixed(2)}ms
Multiplication: ${results.multiplication.toFixed(2)}ms
${useWebWorkers && workerSupported ? "(Web Worker)" : "(Main Thread)"}`;

        setPaillierResult(benchmarkText);
      } else {
        let results: any;
        if (useWebWorkers && workerSupported) {
          // Use Web Worker for BGV benchmarking
          results = await cryptoWorkerManager.bgvBenchmark(
            bgvParameterSet,
            3,
            (prog, msg) => {
              setProgress(prog * 100);
              setProgressMessage(msg || "");
            }
          );
          toast.success("BGV benchmark completed (Web Worker)");
        } else {
          // Fallback to main thread
          results = await benchmarkBgvOperations(bgvParameterSet, 3);
          toast.success("BGV benchmark completed (Main Thread)");
        }

        const benchmarkText = `BGV Benchmark Results (${bgvParameterSet}):
Key Generation: ${results.keyGeneration.toFixed(2)}ms
Encryption: ${results.encryption.toFixed(2)}ms
Decryption: ${results.decryption.toFixed(2)}ms
Addition: ${results.addition.toFixed(2)}ms
Multiplication: ${results.multiplication.toFixed(2)}ms
Parameters: n=${results.parameters.n}, q-bits=${results.parameters.q.toString(2).length}
${useWebWorkers && workerSupported ? "(Web Worker)" : "(Main Thread)"}`;

        setBgvResult(benchmarkText);
      }
    } catch (error) {
      toast.error(`Benchmark failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleCopy = async () => {
    const result = system === "paillier" ? paillierResult : bgvResult;
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      toast.success("Results copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy results");
    }
  };

  const clearResults = () => {
    if (system === "paillier") {
      setPaillierResult("");
    } else {
      setBgvResult("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Cryptography</CardTitle>
        <CardDescription>
          Homomorphic Encryption (Paillier) and Fully Homomorphic Encryption (BGV)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Cryptographic System
            </label>
            <Select value={system} onValueChange={(value: CryptoSystem) => setSystem(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paillier">Paillier (Homomorphic)</SelectItem>
                <SelectItem value="bgv">BGV (Fully Homomorphic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {system === "bgv" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Parameter Set
              </label>
              <Select
                value={bgvParameterSet}
                onValueChange={(value: keyof typeof BGV_PARAMETER_SETS) => setBgvParameterSet(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toy">Toy (Fast, No Security)</SelectItem>
                  <SelectItem value="small">Small (Balanced)</SelectItem>
                  <SelectItem value="medium">Medium (More Secure)</SelectItem>
                  <SelectItem value="large">Large (High Security)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Performance Mode
            </label>
            <div className="flex items-center space-x-2">
              <Switch
                id="web-workers"
                checked={useWebWorkers}
                onCheckedChange={setUseWebWorkers}
                disabled={!workerSupported}
              />
              <Label htmlFor="web-workers" className="text-sm">
                Use Web Workers
                {!workerSupported && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Unsupported
                  </Badge>
                )}
                {workerSupported && useWebWorkers && (
                  <Badge variant="default" className="ml-2 text-xs">
                    Background Processing
                  </Badge>
                )}
                {workerSupported && !useWebWorkers && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Main Thread
                  </Badge>
                )}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {workerSupported
                ? "Web Workers prevent UI blocking during intensive operations"
                : "Web Workers not supported in this environment"
              }
            </p>
          </div>
        </div>

        {securityAnalysis && system === "bgv" && (
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Security Analysis</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Security Level:</span>
                <Badge variant={
                  securityAnalysis.securityLevel === 'toy' ? 'destructive' :
                  securityAnalysis.securityLevel === 'experimental' ? 'secondary' :
                  securityAnalysis.securityLevel === 'research' ? 'default' : 'default'
                }>
                  {securityAnalysis.securityLevel}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Browser Suitability:</span>
                <Badge variant={
                  securityAnalysis.browserSuitability === 'excellent' ? 'default' :
                  securityAnalysis.browserSuitability === 'good' ? 'secondary' :
                  securityAnalysis.browserSuitability === 'limited' ? 'secondary' : 'destructive'
                }>
                  {securityAnalysis.browserSuitability}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Recommended Use:</span>
                <p className="text-muted-foreground">{securityAnalysis.recommendedUse.join(", ")}</p>
              </div>
              <div>
                <span className="font-medium">Limitations:</span>
                <p className="text-muted-foreground">{securityAnalysis.limitations.join(", ")}</p>
              </div>
            </div>
          </div>
        )}

        {(isProcessing && progress > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
            {progressMessage && (
              <p className="text-xs text-muted-foreground">{progressMessage}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGenerateKeys} disabled={isProcessing}>
            {isProcessing ? "Generating..." : "Generate Keys"}
          </Button>
          <Button
            variant="outline"
            onClick={handleBasicEncryption}
            disabled={isProcessing || (system === "paillier" ? !paillierKeys : !bgvKeys)}
          >
            Test Encryption
          </Button>
          {system === "paillier" && (
            <Button
              variant="outline"
              onClick={handleVotingDemo}
              disabled={isProcessing || !paillierKeys}
            >
              Voting Demo
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCalculatorDemo}
            disabled={isProcessing || (system === "paillier" ? !paillierKeys : !bgvKeys)}
          >
            Calculator Demo
          </Button>
          <Button
            variant="outline"
            onClick={handleBenchmark}
            disabled={isProcessing}
          >
            Benchmark
          </Button>
        </div>

        <Textarea
          value={system === "paillier" ? paillierInput : bgvInput}
          onChange={(e) => {
            if (system === "paillier") {
              setPaillierInput(e.target.value);
            } else {
              setBgvInput(e.target.value);
            }
          }}
          placeholder="Enter text to encrypt..."
          rows={3}
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Textarea
          value={system === "paillier" ? paillierResult : bgvResult}
          readOnly
          rows={8}
          placeholder="Results will appear here..."
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!(system === "paillier" ? paillierResult : bgvResult)}
          >
            Copy Results
          </Button>
          <Button variant="ghost" onClick={clearResults}>
            Clear
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}