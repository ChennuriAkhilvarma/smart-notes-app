package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Note struct {
	ID      primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title   string             `bson:"title" json:"title"`
	Content string             `bson:"content" json:"content"`
	Summary string             `bson:"summary,omitempty" json:"summary,omitempty"`
	UserID  string             `bson:"userId" json:"userId"`
	Tags    []string           `bson:"tags,omitempty" json:"tags,omitempty"`
}
