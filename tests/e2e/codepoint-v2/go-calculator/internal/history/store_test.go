package history

import "testing"

func TestAddAndGet(t *testing.T) {
	store := NewHistoryStore()

	id := store.Add("2+3", "5.0")
	if id != 1 {
		t.Errorf("expected id 1, got %d", id)
	}

	record, ok := store.Get(1)
	if !ok {
		t.Fatal("record not found")
	}
	if record.Expression != "2+3" {
		t.Errorf("expression = %s, want 2+3", record.Expression)
	}
}

func TestGetNotFound(t *testing.T) {
	store := NewHistoryStore()
	_, ok := store.Get(999)
	if ok {
		t.Error("expected not found")
	}
}

func TestGetAll(t *testing.T) {
	store := NewHistoryStore()
	store.Add("2+3", "5.0")
	store.Add("10/2", "5.0")

	records := store.GetAll()
	if len(records) != 2 {
		t.Errorf("expected 2 records, got %d", len(records))
	}
}
