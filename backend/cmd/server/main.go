package main

import (
	"log"
	"smart-notes/internal/database"
	"smart-notes/internal/handlers"
	"smart-notes/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found or could not be loaded")
	}

	// Initialize MongoDB
	client, err := database.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	router.POST("/api/signup", handlers.Signup(client))
	router.POST("/api/login", handlers.Login(client))

	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/notes", handlers.GetNotes(client))
		api.GET("/notes/:id", handlers.GetNote(client))
		api.POST("/notes", handlers.CreateNote(client))
		api.PUT("/notes/:id", handlers.UpdateNote(client))
		api.DELETE("/notes/:id", handlers.DeleteNote(client))
	}

	router.Run(":8080")
}
