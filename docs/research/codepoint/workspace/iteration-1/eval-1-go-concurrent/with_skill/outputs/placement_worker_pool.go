// handler/worker_pool.go
package handler

import (
	"sync"

	"myproject/codepoint"
)

// WorkerPool is a fixed-size goroutine pool.
// Code points here track task submission and worker lifecycle --
// critical for diagnosing data inconsistency caused by pool saturation
// or out-of-order execution.
type WorkerPool struct {
	wg       sync.WaitGroup
	taskCh   chan func()
	quitCh   chan struct{}
	workerID int
	mu       sync.Mutex
}

func NewWorkerPool(size int) *WorkerPool {
	pool := &WorkerPool{
		taskCh: make(chan func(), size*10),
		quitCh: make(chan struct{}),
	}

	pool.mu.Lock()
	for i := 0; i < size; i++ {
		pool.workerID = i
		pool.wg.Add(1)
		go pool.worker(i)
	}
	pool.mu.Unlock()

	codepoint.PointWithMeta("worker_pool_initialized", map[string]any{"size": size})
	return pool
}

func (p *WorkerPool) worker(id int) {
	defer p.wg.Done()

	codepoint.PointWithMeta("worker_pool_worker_started", map[string]any{"worker_id": id})

	for {
		select {
		case task := <-p.taskCh:
			// --- Code point: worker picks up a task ---
			codepoint.PointWithGoroutineID("worker_pool_task_received")
			task()
			codepoint.PointWithGoroutineID("worker_pool_task_completed")
		case <-p.quitCh:
			codepoint.PointWithMeta("worker_pool_worker_shutdown", map[string]any{"worker_id": id})
			return
		}
	}
}

func (p *WorkerPool) Submit(task func()) {
	codepoint.PointWithGoroutineID("worker_pool_submit")
	p.taskCh <- task
	codepoint.PointWithGoroutineID("worker_pool_submit_enqueued")
}

func (p *WorkerPool) Shutdown() {
	codepoint.Point("worker_pool_shutdown_requested")
	close(p.quitCh)
	p.wg.Wait()
	codepoint.Point("worker_pool_shutdown_complete")
}
