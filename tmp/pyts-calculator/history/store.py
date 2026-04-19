"""In-memory history store for calculation records."""

import threading


class HistoryStore:
    def __init__(self):
        self._records = {}
        self._next_id = 1
        self._lock = threading.Lock()

    def add(self, expr: str, result: str) -> int:
        with self._lock:
            record_id = self._next_id
            self._next_id += 1
            self._records[record_id] = {
                "id": record_id,
                "expression": expr,
                "result": result,
            }
            return record_id

    def get(self, record_id: int) -> dict:
        with self._lock:
            return self._records.get(record_id)

    def get_all(self) -> list:
        with self._lock:
            return list(self._records.values())
