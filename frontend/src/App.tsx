import React, { useState, useEffect } from 'react';
import { ChakraProvider, Heading, Container, VStack, Button, Input, HStack, Text } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { NoteEditor } from './components/NoteEditor';
import { NoteList } from './components/NoteList';
import { api } from './services/api';
import { Note } from './types';

const limit = 5;

const MainApp: React.FC = () => {
  const { token, logout } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch notes from backend
  const fetchNotes = async () => {
    if (!token) return;
    try {
      const data = await api.getNotes(search, page, limit);
      setNotes(data.notes || []);
      setTotal(data.total || 0);
    } catch (error) {
      setNotes([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, [token, search, page]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Called after create/update
  const handleSave = () => {
    setEditingNote(null);
    fetchNotes();
  };

  // Called after delete
  const handleDelete = async (id: string) => {
    await api.deleteNote(id);
    fetchNotes();
  };

  if (!token) {
    return showSignup ? (
      <Signup onSwitch={() => setShowSignup(false)} />
    ) : (
      <Login onSwitch={() => setShowSignup(true)} />
    );
  }

  return (
    <>
      <Button onClick={logout} colorScheme="red" position="absolute" top={4} right={4}>
        Logout
      </Button>
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Smart Notes
          </Heading>
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            mb={4}
          />
          <NoteEditor note={editingNote} onFinishEdit={handleSave} />
          <NoteList notes={notes} onEdit={setEditingNote} onDelete={handleDelete} />
          <HStack justify="center" mt={4}>
            <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <Text>
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </Text>
            <Button onClick={() => setPage(page + 1)} disabled={page * limit >= total}>
              Next
            </Button>
          </HStack>
        </VStack>
      </Container>
    </>
  );
};

const App: React.FC = () => (
  <ChakraProvider>
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  </ChakraProvider>
);

export default App;