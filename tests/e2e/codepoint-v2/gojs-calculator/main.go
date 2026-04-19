package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"gojs-calculator/codepoint"
	"gojs-calculator/internal/api"
	"gojs-calculator/internal/history"
)

//go:embed frontend/dist/*
var frontendDist embed.FS

func main() {
	port := flag.Int("port", 8080, "HTTP server port")
	flag.Parse()

	ensureCodepointToggle()

	store := history.NewHistoryStore()
	server := api.NewServer(store)
	addr := fmt.Sprintf(":%d", *port)

	mux := http.NewServeMux()

	// CRITICAL: Register collector and API BEFORE SPA fallback (Pitfall 4)
	mux.HandleFunc("POST /__codepoint__", codepoint.CollectorHandler())
	mux.Handle("/api/", server)

	// SPA fallback: serve embedded frontend
	frontend, _ := fs.Sub(frontendDist, "frontend/dist")
	fileServer := http.FileServer(http.FS(frontend))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			cleanPath := path.Clean(r.URL.Path)
			if f, err := frontend.Open(cleanPath[1:]); err == nil {
			f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}
		http.ServeFileFS(w, r, frontend, "index.html")
	})

	fmt.Printf("Go+JS Calculator server listening on %s\n", addr)
	fmt.Printf("Endpoints:\n")
	fmt.Printf("  POST /api/calculate  {\"expression\": \"2+3\"}\n")
	fmt.Printf("  GET  /api/history     (list all)\n")
	fmt.Printf("  GET  /api/history/{id} (recompute through shared pipeline)\n")
	fmt.Printf("  POST /api/batch       {\"expressions\": [\"2+3\", \"(1+2)*3\"]}\n")
	fmt.Printf("  POST /__codepoint__   (frontend probe collector)\n")

	defer codepoint.Close()
	defer codepoint.CloseCollector()

	if err := http.ListenAndServe(addr, mux); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}

func ensureCodepointToggle() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	toggleDir := filepath.Join(home, ".codepoint")
	os.MkdirAll(toggleDir, 0755)
	// Ensure BOTH Go and TS toggles exist
	for _, name := range []string{".codepoint-go", ".codepoint-ts"} {
		toggleFile := filepath.Join(toggleDir, name)
		if _, err := os.Stat(toggleFile); os.IsNotExist(err) {
			os.WriteFile(toggleFile, []byte{}, 0644)
			fmt.Println("Codepoint toggle enabled: " + toggleFile)
		}
	}
}
