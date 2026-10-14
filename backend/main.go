package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

// ============================
// Configuration
// ============================

// ============================
// Configuration
// ============================

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	ListenPort string
}

func loadConfig() Config {
	return Config{
		DBHost:     getEnv("DB_HOST", "127.0.0.1"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "monitoring"),
		DBPassword: getEnv("DB_PASSWORD", "devlabhub123"),
		DBName:     getEnv("DB_NAME", "devlabhub_monitoring"),
		ListenPort: getEnv("LISTEN_PORT", "3010"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ============================
// Models
// ============================

type Pod struct {
	ID        int      `json:"id"`
	Name      string   `json:"name"`
	Image     string   `json:"image"`
	Status    string   `json:"status"`
	Ports     []string `json:"ports"`
	CreatedAt string   `json:"created_at"`
	UpdatedAt string   `json:"updated_at"`
}

type AccessLog struct {
	ID           int     `json:"id"`
	PodID        int     `json:"pod_id"`
	IPAddress    string  `json:"ip_address"`
	UserName     string  `json:"user_name"`
	AuthMethod   string  `json:"auth_method"`
	Port         int     `json:"port"`
	SessionID    string  `json:"session_id"`
	FailedCount  int     `json:"failed_count"`
	SuccessfulCount int  `json:"successful_count"`
	TotalAccess  int     `json:"total_access"`
	FirstAccess  string  `json:"first_access"`
	LastAccess   string  `json:"last_access"`
	CreatedAt    string  `json:"created_at"`
}

type ThreatPrediction struct {
	ID          int     `json:"id"`
	PodID       int     `json:"pod_id"`
	IPAddress   string  `json:"ip_address"`
	ThreatLevel string  `json:"threat_level"`
	Score       int     `json:"score"`
	Reason      string  `json:"reason"`
	DetectedAt  string  `json:"detected_at"`
}

type Warning struct {
	ID        int    `json:"id"`
	PodID     int    `json:"pod_id"`
	Type      string `json:"type"`
	Message   string `json:"message"`
	Severity  string `json:"severity"`
	Confirmed bool   `json:"acknowledged"`
	CreatedAt string `json:"created_at"`
}

type Stats struct {
	TotalPods    int `json:"total_pods"`
	RunningPods  int `json:"running_pods"`
	ExitedPods   int `json:"exited_pods"`
	TotalAccess  int `json:"total_access"`
	HighThreat   int `json:"high_threat"`
	ResourceWarn int   `json:"resource_warn"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Stats   Stats       `json:"stats,omitempty"`
}

// ============================
// Database Connection
// ============================

func connectDB(cfg Config) (*sql.DB, error) {
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	return db, nil
}

// ============================
// Static File Handler
// ============================

func staticHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// API routes tetap ke handler masing-masing
		if r.URL.Path == "/health" {
			healthCheckHandler(w, r)
			return
		}
		if r.URL.Path == "/api/pods" {
			getPodsHandler(w, r)
			return
		}
		if r.URL.Path == "/api/pods/details" {
			getPodDetailsHandler(w, r)
			return
		}
		if r.URL.Path == "/api/pods/access" {
			getAccessLogsHandler(w, r)
			return
		}
		if r.URL.Path == "/api/metrics" {
			getMetricsHandler(w, r)
			return
		}
		if r.URL.Path == "/api/threats" {
			getThreatsHandler(w, r)
			return
		}
		if r.URL.Path == "/api/warnings" {
			getWarningsHandler(w, r)
			return
		}
		// SPA fallback - semuanya ke index.html kecuali API
		http.FileServer(http.Dir("frontend_dist")).ServeHTTP(w, r)
	})
}

// ============================
// Handlers
// ============================

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Server OK",
		Data: map[string]string{
			"status": "healthy",
			"time":   time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func getPodsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Pods list",
		Data: []Pod{
			{
				ID:        1,
				Name:      "portfolio-api",
				Image:     "ghcr.io/syarifudinyoga/portfolio-backend:1.0.0",
				Status:    "Up 2 days",
				Ports:     []string{"127.0.0.1:3004->3004/tcp"},
				CreatedAt: time.Now().Add(-48 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        2,
				Name:      "portfolio-frontend",
				Image:     "ghcr.io/syarifudinyoga/portfolio-frontend:1.0.0",
				Status:    "Up 11 hours",
				Ports:     []string{"127.0.0.1:3005->80/tcp"},
				CreatedAt: time.Now().Add(-11 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        3,
				Name:      "barbersip-frontend",
				Image:     "ghcr.io/syarifudinyoga/barbersip-frontend:2.0.0",
				Status:    "Up 11 hours",
				Ports:     []string{"127.0.0.1:3000->3000/tcp"},
				CreatedAt: time.Now().Add(-11 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        4,
				Name:      "api",
				Image:     "ghcr.io/syarifudinyoga/barbersip-backend-api:2.0.0",
				Status:    "Up 11 hours",
				Ports:     []string{"0.0.0.0:3001->3001/tcp"},
				CreatedAt: time.Now().Add(-11 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        5,
				Name:      "devlabhub-telegram-bot",
				Image:     "ghcr.io/syarifudinyoga/devlabhub-telegram-bot:3",
				Status:    "Up 42 min (healthy)",
				Ports:     []string{"127.0.0.1:3006->3006/tcp"},
				CreatedAt: time.Now().Add(-42 * time.Minute).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        6,
				Name:      "node-exporter",
				Image:     "",
				Status:    "Up 9 days",
				Ports:     []string{},
				CreatedAt: time.Now().Add(-9 * 24 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        7,
				Name:      "prometheus",
				Image:     "docker.io/prom/prometheus:latest",
				Status:    "Up 9 days",
				Ports:     []string{"127.0.0.1:9090->9090/tcp"},
				CreatedAt: time.Now().Add(-9 * 24 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        8,
				Name:      "grafana",
				Image:     "docker.io/grafana/grafana:latest",
				Status:    "Up 9 days",
				Ports:     []string{"100.87.90.67:3002->3000/tcp"},
				CreatedAt: time.Now().Add(-9 * 24 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        9,
				Name:      "postgres",
				Image:     "docker.io/library/postgres:16-alpine",
				Status:    "Up 44 hours",
				Ports:     []string{"127.0.0.1:5432->5432/tcp"},
				CreatedAt: time.Now().Add(-44 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID:        10,
				Name:      "minio",
				Image:     "cgr.dev/chainguard/minio:latest",
				Status:    "Up 44 hours",
				Ports:     []string{"127.0.0.1:9000-9001->9000-9001/tcp"},
				CreatedAt: time.Now().Add(-44 * time.Hour).Format(time.RFC3339),
				UpdatedAt: time.Now().Format(time.RFC3339),
			},
		},
	})
}

func getPodDetailsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Pod details",
		Data: map[string]interface{}{
			"id":    1,
			"name":  "portfolio-api",
			"image": "ghcr.io/syarifudinyoga/portfolio-backend:1.0.0",
			"status": "Up 2 days",
			"ports": []string{"127.0.0.1:3004->3004/tcp"},
		},
	})
}

func getAccessLogsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Access logs",
		Data: []AccessLog{
			{
				ID:           1,
				PodID:        10,
				IPAddress:    "100.120.175.90",
				UserName:     "devlabhub",
				AuthMethod:   "publickey",
				Port:         3006,
				SessionID:    "uFDciA8iYKu5XL8HAAAB",
				FailedCount:  0,
				SuccessfulCount: 75,
				TotalAccess:  75,
				FirstAccess:  time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
				LastAccess:   time.Now().Format(time.RFC3339),
				CreatedAt:    time.Now().Format(time.RFC3339),
			},
		},
	})
}

func getMetricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Resource metrics",
		Data: map[string]interface{}{
			"cpu_percent":     2.4,
			"memory_used":     1604300000,
			"memory_total":    6851300000,
			"disk_used":       15000000000,
			"disk_total":      290000000000,
			"timestamp":       time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func getThreatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Threat predictions",
		Data: []ThreatPrediction{
			{
				ID:          1,
				PodID:       10,
				IPAddress:   "100.120.175.90",
				ThreatLevel: "high",
				Score:       75,
				Reason:      "High SSH access rate from external IP",
				DetectedAt:  time.Now().UTC().Format(time.RFC3339),
			},
			{
				ID:          2,
				PodID:       1,
				IPAddress:   "192.168.100.6",
				ThreatLevel: "low",
				Score:       10,
				Reason:      "Normal internal network access",
				DetectedAt:  time.Now().UTC().Format(time.RFC3339),
			},
		},
	})
}

func getWarningsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: "Resource warnings",
		Data: []Warning{
			{
				ID:        1,
				PodID:     1,
				Type:      "resource",
				Message:   "CPU usage above 80% threshold",
				Severity:  "high",
				Confirmed: false,
				CreatedAt: time.Now().UTC().Format(time.RFC3339),
			},
		},
	})
}

func main() {
	cfg := loadConfig()
	
	// Connect to database
	db, err := connectDB(cfg)
	if err != nil {
		log.Printf("Database connection failed: %v", err)
	} else {
		defer db.Close()
		log.Println("Database connected")
	}
	
	// Setup HTTP server
	router := setupRoutes()
	
	server := &http.Server{
		Addr:         ":" + cfg.ListenPort,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
	
	log.Printf("DevLabHub Monitor starting on port %s", cfg.ListenPort)
	log.Printf("Database: %s/%s@%s:%s", cfg.DBUser, cfg.DBName, cfg.DBHost, cfg.DBPort)
	
	if err := server.ListenAndServe(); err != nil {
		log.Printf("Server failed: %v", err)
	}
}

// ============================
// Route Setup
// ============================

// ============================
// Route Setup
// ============================

func setupRoutes() http.Handler {
	return staticHandler()
}
