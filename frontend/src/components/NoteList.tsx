import React from 'react';
import { Box, VStack, Heading, Text, Button, HStack } from '@chakra-ui/react';
import { Note } from '../types';

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, onEdit, onDelete }) => (
  <VStack spacing={4} align="stretch">
    <Heading size="lg">My Notes</Heading>
    {notes.map((note) => (
      <Box key={note.id} p={4} borderWidth={1} borderRadius="md">
        <Heading size="md">{note.title}</Heading>
        <Text mt={2}>{note.content}</Text>
        {/* Show the summary if it exists */}
        {note.summary && (
  <Box mt={2} p={2} bg="yellow.50" borderRadius="md" fontSize="sm">
    <strong>Summary:</strong> {note.summary}
  </Box>
)}
        {/* Show tags if they exist */}
        {note.tags && note.tags.length > 0 && (
          <HStack mt={2} spacing={2}>
            {note.tags.map(tag => (
              <Box key={tag} px={2} py={1} bg="gray.200" borderRadius="md" fontSize="sm">
                {tag}
              </Box>
            ))}
          </HStack>
        )}
        <HStack mt={4}>
          <Button size="sm" colorScheme="blue" onClick={() => onEdit(note)}>
            Edit
          </Button>
          <Button size="sm" colorScheme="red" onClick={() => onDelete(note.id.toString())}>
            Delete
          </Button>
        </HStack>
      </Box>
    ))}
  </VStack>
);