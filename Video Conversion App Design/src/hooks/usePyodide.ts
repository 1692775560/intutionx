import { useState, useEffect, useCallback } from 'react';
import { loadPyodide, PyodideInterface } from 'pyodide';

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        console.log('Loading Pyodide...');
        const pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        
        console.log('Pyodide loaded, loading packages...');
        await pyodideInstance.loadPackage(['numpy', 'pandas']);
        
        if (mounted) {
          setPyodide(pyodideInstance);
          setLoading(false);
          console.log('Pyodide ready');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load Pyodide');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const runCode = useCallback(
    async (code: string): Promise<{ output: string; error: string | null }> => {
      if (!pyodide) {
        return { output: '', error: 'Pyodide not initialized' };
      }

      try {
        await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
        `);

        await pyodide.runPythonAsync(code);

        const stdout = pyodide.runPython('sys.stdout.getvalue()');
        const stderr = pyodide.runPython('sys.stderr.getvalue()');

        return {
          output: stdout,
          error: stderr || null,
        };
      } catch (err) {
        return {
          output: '',
          error: err instanceof Error ? err.message : 'Execution failed',
        };
      }
    },
    [pyodide]
  );

  return { pyodide, loading, error, runCode };
}
