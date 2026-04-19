import { useState } from 'react';
import { pointWithMeta } from '../lib/codepoint';
import { batchCalculate } from '../api/client';
import type { BatchResult } from '../api/client';

export default function BatchCalc() {
  const [expressions, setExpressions] = useState('');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setResults([]);

    const lines = expressions
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    // Frontend probe: batch submit (in event handler, NOT useEffect)
    pointWithMeta('cp-fe-batch-submit', {
      point_id: 'cp-fe-batch-submit',
      flow_id: 'flow-batch-process',
      count: lines.length,
    });

    try {
      const resp = await batchCalculate(lines);

      // Frontend probe: batch response received (in async continuation of event handler)
      pointWithMeta('cp-fe-batch-response', {
        point_id: 'cp-fe-batch-response',
        flow_id: 'flow-batch-process',
        count: resp.length,
      });

      setResults(resp);
    } catch {
      pointWithMeta('cp-fe-batch-error', {
        point_id: 'cp-fe-batch-error',
        flow_id: 'flow-batch-process',
      });
      setError('Network error');
    }
  };

  return (
    <div>
      <h2>Batch Calculator</h2>
      <textarea
        value={expressions}
        onChange={(e) => setExpressions(e.target.value)}
        placeholder={"Enter expressions, one per line:\n2+3\n(1+2)*3\n10/2"}
        rows={6}
      />
      <button onClick={handleSubmit}>Calculate All</button>
      {error && <div className="result error">{error}</div>}
      {results.length > 0 && (
        <div className="batch-results">
          {results.map((r, i) => (
            <div key={i} className="batch-row">
              <span className="expr">{r.expression}</span>
              {r.error ? (
                <span className="err">{r.error}</span>
              ) : (
                <span className="output">= {r.output}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
