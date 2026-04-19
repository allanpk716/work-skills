package history

import (
	"sync"
)

// Record represents a single calculation history entry.
type Record struct {
	ID         int
	Expression string
	Result     any // string for success, error string for failure
}

// HistoryStore is an in-memory store for calculation history.
type HistoryStore struct {
	mu      sync.RWMutex
	records []Record
	nextID  int
}

func NewHistoryStore() *HistoryStore {
	return &HistoryStore{
		records: make([]Record, 0),
		nextID:  1,
	}
}

func (s *HistoryStore) Add(expression string, result any) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := s.nextID
	s.nextID++
	s.records = append(s.records, Record{
		ID:         id,
		Expression: expression,
		Result:     result,
	})
	return id
}

func (s *HistoryStore) Get(id int) (Record, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, r := range s.records {
		if r.ID == id {
			return r, true
		}
	}
	return Record{}, false
}

func (s *HistoryStore) GetAll() []Record {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Record, len(s.records))
	copy(result, s.records)
	return result
}

func (s *HistoryStore) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.records)
}

func (s *HistoryStore) FindByExpression(prefix string) []Record {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []Record
	for _, r := range s.records {
		if len(r.Expression) >= len(prefix) && r.Expression[:len(prefix)] == prefix {
			result = append(result, r)
		}
	}
	return result
}
