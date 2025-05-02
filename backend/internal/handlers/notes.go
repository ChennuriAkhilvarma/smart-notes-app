package handlers

import (
	"context"
	"log"
	"net/http"
	"smart-notes/internal/ai"
	"smart-notes/internal/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetNotes(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserIDFromContext(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		search := c.Query("search")
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
		if page < 1 {
			page = 1
		}
		if limit < 1 {
			limit = 5
		}

		filter := bson.M{"userId": userID}
		if search != "" {
			filter["$or"] = []bson.M{
				{"title": bson.M{"$regex": search, "$options": "i"}},
				{"content": bson.M{"$regex": search, "$options": "i"}},
			}
		}

		collection := client.Database("smart_notes").Collection("notes")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		opts := options.Find()
		opts.SetSkip(int64((page - 1) * limit))
		opts.SetLimit(int64(limit))
		opts.SetSort(bson.D{{Key: "_id", Value: -1}}) // Newest first

		collector, err := collection.Find(ctx, filter, opts)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer collector.Close(ctx)

		var notes []models.Note
		if err = collector.All(ctx, &notes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Get total count for pagination
		total, err := collection.CountDocuments(ctx, filter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"notes": notes,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

func GetNote(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserIDFromContext(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		id := c.Param("id")
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		var note models.Note
		collection := client.Database("smart_notes").Collection("notes")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		err = collection.FindOne(ctx, bson.M{"_id": objID, "userId": userID}).Decode(&note)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, note)
	}
}

func CreateNote(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var note models.Note
		if err := c.BindJSON(&note); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validation: prevent empty title or content
		if len(note.Title) == 0 || len(note.Content) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title and content are required"})
			return
		}

		userID, ok := getUserIDFromContext(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		note.UserID = userID

		// Generate AI summary
		summary, err := ai.GenerateSummary(note.Content)
		if err == nil {
			note.Summary = summary
		}
		log.Println("Generated summary:", summary, "Error:", err)

		collection := client.Database("smart_notes").Collection("notes")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		result, err := collection.InsertOne(ctx, note)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		note.ID = result.InsertedID.(primitive.ObjectID)
		c.JSON(http.StatusCreated, note)
	}
}

func UpdateNote(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserIDFromContext(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		id := c.Param("id")
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		var note models.Note
		if err := c.BindJSON(&note); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validation: prevent empty title or content
		if len(note.Title) == 0 || len(note.Content) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title and content are required"})
			return
		}

		// Generate AI summary
		summary, err := ai.GenerateSummary(note.Content)
		if err == nil {
			note.Summary = summary
		}

		collection := client.Database("smart_notes").Collection("notes")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		filter := bson.M{"_id": objID, "userId": userID}
		update := bson.M{
			"$set": bson.M{
				"title":   note.Title,
				"content": note.Content,
				"summary": note.Summary,
				"tags":    note.Tags,
			},
		}

		result, err := collection.UpdateOne(ctx, filter, update)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found or not yours"})
			return
		}

		note.ID = objID
		c.JSON(http.StatusOK, note)
	}
}
func DeleteNote(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserIDFromContext(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		id := c.Param("id")
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		collection := client.Database("smart_notes").Collection("notes")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Only delete if the note belongs to the user
		result, err := collection.DeleteOne(ctx, bson.M{"_id": objID, "userId": userID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found or not yours"})
			return
		}

		c.Status(http.StatusNoContent)
	}
}
func getUserIDFromContext(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	idStr, ok := userID.(string)
	return idStr, ok
}
