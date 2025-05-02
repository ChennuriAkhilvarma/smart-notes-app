package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func GenerateSummary(content string) (string, error) {
	apiKey := os.Getenv("HUGGINGFACE_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("Hugging Face API key not set")
	}

	model := "facebook/bart-large-cnn"
	url := fmt.Sprintf("https://api-inference.huggingface.co/models/%s", model)

	payload, _ := json.Marshal(map[string]string{
		"inputs": content,
	})
	// Create the HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	// Parse the response from the API
	var result []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result) > 0 {
		if summary, ok := result[0]["summary_text"].(string); ok {
			return summary, nil
		}
	}
	return "", fmt.Errorf("No summary returned")
}
