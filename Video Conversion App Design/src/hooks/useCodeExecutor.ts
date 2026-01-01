import { useState, useCallback } from 'react';
import CodeInterpreter from '@e2b/code-interpreter';

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  logs?: string[];
}

export const useCodeExecutor = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const executeCode = useCallback(async (code: string): Promise<ExecutionResult> => {
    setIsExecuting(true);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_E2B_API_KEY;
      
      if (!apiKey) {
        throw new Error('E2B API key not configured');
      }

      const sandbox = await CodeInterpreter.create({
        apiKey: apiKey,
      });

      try {
        const execution = await sandbox.runPython(code);

        const logs: string[] = [];
        if (execution.logs.stdout.length > 0) {
          logs.push(...execution.logs.stdout);
        }
        if (execution.logs.stderr.length > 0) {
          logs.push(...execution.logs.stderr);
        }
        
        let output = '';
        if (execution.results && execution.results.length > 0) {
          output = execution.results.map((r: any) => {
            if (r.text) return r.text;
            if (r.png) return '[Image output]';
            if (r.jpeg) return '[Image output]';
            return JSON.stringify(r);
          }).join('\n');
        }

        const executionResult: ExecutionResult = {
          success: !execution.error,
          output: output || logs.join('\n'),
          error: execution.error?.value || execution.error?.name,
          logs: logs,
        };

        setResult(executionResult);
        return executionResult;

      } finally {
        await sandbox.kill();
      }

    } catch (error) {
      const executionResult: ExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      
      setResult(executionResult);
      return executionResult;

    } finally {
      setIsExecuting(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    executeCode,
    clearResult,
    isExecuting,
    result,
  };
};
