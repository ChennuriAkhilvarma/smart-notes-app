import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Textarea, VStack, useToast, Text } from '@chakra-ui/react';
import { api } from '../services/api';
import { Note } from '../types';
import nlp from 'compromise';

interface NoteEditorProps {
  note: Note | null;
  onFinishEdit: () => void;
}

// List of common stopwords to ignore for tag suggestions
const STOPWORDS = [
  "the", "is", "in", "at", "of", "a", "and", "to", "it", "for", "on", "with", "as", "this", "that", "by", "an", "be", "are", "from", "or", "was", "but", "not", "have", "has", "had", "they", "you", "we", "he", "she", "his", "her", "their", "our", "my", "your", "so", "if", "out", "about",
  "will", "start", "come", "go", "back", "there", "from", "get", "got", "do", "did", "done", "can", "could", "would", "should", "may", "might"
];

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onFinishEdit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string>('');
  const [summary, setSummary] = useState<string | undefined>('');
  const toast = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags ? note.tags.join(', ') : '');
      setSummary(note.summary);
    } else {
      setTitle('');
      setContent('');
      setTags('');
      setSummary('');
    }
  }, [note]);

  // Compute suggested tags from content using compromise (nouns only)
  const suggestedTags = useMemo(() => {
    if (!content) return [];
    const doc = nlp(content);
    const nouns = doc.nouns().out('array') as string[]; // Type assertion here
    const filteredNouns = nouns
      .map(word => word.toLowerCase())
      .filter(word => word && !STOPWORDS.includes(word));
    const freq: Record<string, number> = {};
    filteredNouns.forEach(word => { freq[word] = (freq[word] || 0) + 1; });
    return Array.from(new Set(filteredNouns))
      .sort((a, b) => freq[b] - freq[a] || a.localeCompare(b))
      .slice(0, 2);
  }, [content]);

  // Handler to add a suggested tag
  const handleAddTag = (tag: string) => {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!tagList.includes(tag)) {
      setTags(tagList.length ? tagList.concat(tag).join(', ') : tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Title and content are required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    try {
      let result: Note;
      if (note) {
        result = await api.updateNote(note.id.toString(), { title, content, tags: tagsArray });
        toast({
          title: "Note updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        result = await api.createNote({ title, content, tags: tagsArray });
        toast({
          title: "Note created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      setTitle('');
      setContent('');
      setTags('');
      setSummary(result.summary);
      onFinishEdit();
    } catch (error) {
      toast({
        title: "Error saving note",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Content</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            rows={6}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Tags (comma separated)</FormLabel>
          <Input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. work, personal, urgent"
          />
          {/* Tag suggestions */}
          {suggestedTags.length > 0 && (
            <Box mt={2}>
              <Text fontSize="sm" color="gray.500">Suggested tags:</Text>
              {suggestedTags.map(tag => (
                <Button
                  key={tag}
                  size="xs"
                  variant="outline"
                  colorScheme="teal"
                  mr={2}
                  mt={1}
                  onClick={() => handleAddTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </Box>
          )}
        </FormControl>
        <Button type="submit" colorScheme="blue">
          {note ? 'Update Note' : 'Save Note'}
        </Button>
      </VStack>
    </Box>
  );
};