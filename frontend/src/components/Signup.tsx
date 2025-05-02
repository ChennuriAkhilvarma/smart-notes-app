import React, { useState } from 'react';
import { api } from '../services/api';
import { Box, Button, Input, VStack, Heading, Text } from '@chakra-ui/react';

export const Signup: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.signup(username, password);
      setSuccess('Signup successful!');
      setTimeout(() => {
        onSwitch(); // Switch to login form after 1.5 seconds
      }, 1500);
    } catch (err) {
      setError('Signup failed. Username may already exist.');
    }
  };

  return (
    <Box maxW="sm" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <Heading mb={4}>Sign Up</Heading>
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
          {success && <Text color="green.500">{success}</Text>}
          <Button type="submit" colorScheme="blue" width="full">
            Sign Up
          </Button>
          <Button variant="link" onClick={onSwitch}>
            Already have an account? Login
          </Button>
        </VStack>
      </form>
    </Box>
  );
};