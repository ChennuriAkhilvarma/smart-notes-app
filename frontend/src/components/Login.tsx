import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../services/api';
import { Box, Button, Input, VStack, Heading, Text } from '@chakra-ui/react';

export const Login: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.login(username, password);
      login(response.data.token);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <Box maxW="sm" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <Heading mb={4}>Login</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <Text color="red.500">{error}</Text>}
          <Button type="submit" colorScheme="blue" width="full">
            Login
          </Button>
          <Button variant="link" onClick={onSwitch}>
            Don't have an account? Sign up
          </Button>
        </VStack>
      </form>
    </Box>
  );
};