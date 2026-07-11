import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  sources?: Array<{
    file_name: string;
    chunk_index: number;
    excerpt: string;
  }>;
};

export default function ChatScreen() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ask a question about the sample documents.',
    },
  ]);
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || busy) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setBusy(true);

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail ?? 'Chat request failed.');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload.answer,
        sources: payload.sources,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `I could not answer that right now. ${message}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>

      <ScrollView style={styles.chatWindow} contentContainerStyle={styles.chatContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={message.role === 'user' ? styles.userBubble : styles.assistantBubble}
          >
            <Text style={message.role === 'user' ? styles.userMessageText : styles.messageText}>
              {message.content}
            </Text>

            {message.sources?.length ? (
              <View style={styles.sourceList}>
                {message.sources.map((source, index) => (
                  <View key={`${source.file_name}-${source.chunk_index}-${index}`} style={styles.sourceCard}>
                    <Text style={styles.sourceTitle}>
                      {source.file_name} · chunk {source.chunk_index}
                    </Text>
                    <Text style={styles.sourceExcerpt}>{source.excerpt}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about the sample documents"
          style={styles.input}
        />
        <Pressable onPress={handleSend} style={styles.sendButton} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  chatWindow: {
    flex: 1,
  },
  chatContent: {
    gap: 12,
    paddingBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe4f0',
  },
  messageText: {
    color: '#0f172a',
    fontSize: 15,
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sourceList: {
    marginTop: 10,
    gap: 6,
  },
  sourceCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
  },
  sourceTitle: {
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  sourceExcerpt: {
    color: '#334155',
    fontSize: 12,
  },
});
