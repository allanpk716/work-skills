import { useState } from 'react';
import { pointWithMeta } from '../lib/codepoint';
import { calculate } from '../api/client';

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setResult('');

    // Frontend probe: submit action (in event handler, NOT useEffect)
    pointWithMeta('cp-fe-calc-submit', {
      point_id: 'cp-fe-calc-submit',
      flow_id: 'flow-api-calculate',
      expr: expression,
    });

    try {
      const resp = await calculate(expression);

      // Frontend probe: response received (in async continuation of event handler)
      pointWithMeta('cp-fe-calc-response', {
        point_id: 'cp-fe-calc-response',
        flow_id: 'flow-api-calculate',
        result: resp.result,
        error: resp.error,
      });

      if (resp.error) {
        setError(resp.error);
      } else {
        setResult(resp.result);
      }
    } catch {
      pointWithMeta('cp-fe-calc-error', {
        point_id: 'cp-fe-calc-error',
        flow_id: 'flow-api-calculate',
      });
      setError('Network error');
    }
  };

  return (
    <div>
      <h2>Calculator</h2>
      <input
        type="text"
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        placeholder="Enter expression (e.g. 2+3)"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button onClick={handleSubmit}>Calculate</button>
      {result && <div className="result">Result: {result}</div>}
      {error && <div className="result error">Error: {error}</div>}
    </div>
  );
}
