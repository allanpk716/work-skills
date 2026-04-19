package main

import (
	"go-calculator/internal/api"
	"go-calculator/internal/batch"
	"go-calculator/internal/history"
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func main() {
	batchFile := flag.String("batch", "", "Process expressions from file (one per line)")
	batchExpr := flag.String("expr", "", "Process a single expression via CLI")
	port := flag.Int("port", 8080, "HTTP server port")
	flag.Parse()

	ensureCodepointToggle()

	if *batchFile != "" {
		runBatchFile(*batchFile)
		return
	}

	if *batchExpr != "" {
		runSingleExpr(*batchExpr)
		return
	}

	store := history.NewHistoryStore()
	server := api.NewServer(store)
	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Calculator server listening on %s\n", addr)
	fmt.Printf("Endpoints:\n")
	fmt.Printf("  POST /api/calculate  {\"expression\": \"2+3\"}\n")
	fmt.Printf("  GET  /api/history     (list all)\n")
	fmt.Printf("  GET  /api/history/{id} (recompute through shared pipeline)\n")

	if err := http.ListenAndServe(addr, server); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}

func runBatchFile(filePath string) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	fmt.Printf("Processing batch file: %s\n", filePath)
	results, err := batch.ProcessFile(ctx, filePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Batch processing error: %v\n", err)
		os.Exit(1)
	}

	output := batch.FormatResults(results)
	fmt.Print(output)

	successCount := 0
	for _, r := range results {
		if r.Error == "" {
			successCount++
		}
	}
	fmt.Printf("\nSummary: %d/%d expressions computed successfully\n", successCount, len(results))
}

func runSingleExpr(expr string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	results, err := batch.ProcessExpressions(ctx, expr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	fmt.Print(batch.FormatResults(results))
}

func ensureCodepointToggle() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	toggleDir := filepath.Join(home, ".codepoint")
	os.MkdirAll(toggleDir, 0755)
	toggleFile := filepath.Join(toggleDir, ".codepoint-go")
	if _, err := os.Stat(toggleFile); os.IsNotExist(err) {
		os.WriteFile(toggleFile, []byte{}, 0644)
		fmt.Println("Codepoint toggle enabled: " + toggleFile)
	}
}
