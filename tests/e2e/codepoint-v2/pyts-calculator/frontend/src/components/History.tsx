import { useEffect, useState } from 'react';
import { pointWithMeta } from '../lib/codepoint';
import { getHistory, getHistoryDetail } from '../api/client';
import type { HistoryRecord, HistoryDetailResponse } from '../api/client';

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selected, setSelected] = useState<HistoryDetailResponse | null>(null);
  const [error, setError] = useState('');

  // Data loading in useEffect is OK -- no probe here, this is not a user action
  useEffect(() => {
    getHistory().then(setRecords).catch(() => {});
  }, []);

  const handleClick = async (id: number) => {
    setError('');
    setSelected(null);

    // Frontend probe: history item click (in event handler, NOT useEffect)
    pointWithMeta('cp-fe-history-click', {
      point_id: 'cp-fe-history-click',
      flow_id: 'flow-history-query',
      history_id: id,
    });

    try {
      const resp = await getHistoryDetail(id);

      // Frontend probe: history detail received (in async continuation of event handler)
      pointWithMeta('cp-fe-history-detail', {
        point_id: 'cp-fe-history-detail',
        flow_id: 'flow-history-query',
        recomputed: resp.recomputed,
        error: resp.error,
      });

      if (resp.error) {
        setError(resp.error);
      } else {
        setSelected(resp);
      }
    } catch {
      pointWithMeta('cp-fe-history-error', {
        point_id: 'cp-fe-history-error',
        flow_id: 'flow-history-query',
      });
      setError('Network error');
    }
  };

  return (
    <div>
      <h2>History</h2>
      {records.length === 0 && (
        <div className="result">No calculations yet. Use the Calculator tab first.</div>
      )}
      {records.map((r) => (
        <div
          key={r.id}
          className="history-item"
          onClick={() => handleClick(r.id)}
        >
          #{r.id}: {r.expression} = {r.result}
        </div>
      ))}
      {selected && (
        <div className="result">
          <strong>History Detail (Recomputed):</strong>
          <br />Expression: {selected.expression}
          <br />Original: {selected.result}
          <br />Recomputed: {selected.recomputed}
        </div>
      )}
      {error && <div className="result error">{error}</div>}
    </div>
  );
}
