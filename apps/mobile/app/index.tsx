import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export default function HomeScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function handleIndex() {
    setBusy(true);
    setStatus('Indexing local sample documents...');

    try {
      const response = await fetch(`${apiUrl}/ingest/local`, {
        method: 'POST',
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail ?? 'Indexing failed.');
      }

      setStatus(
        `Indexed ${payload.documents_ingested} documents and ${payload.chunks_ingested} chunks.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Drive RAG</Text>
      <Text style={styles.subtitle}>Milestone 1 demo</Text>

      <Pressable onPress={handleIndex} style={styles.primaryButton} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Index Sample Documents</Text>}
      </Pressable>

      <Pressable onPress={() => router.push('/chat')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Open Chat</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  status: {
    marginTop: 16,
    textAlign: 'center',
    color: '#0f172a',
  },
});
