import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PassListItem } from '../components/PassListItem';
import { usePasses } from '../hooks/usePasses';
import { useAuth } from '../../../services/AuthContext';

export function PassListScreen() {
  const router = useRouter();
  const { passes, status, error, refresh } = usePasses();
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your emergency passes</Text>
          <Pressable onPress={() => signOut()} accessibilityRole="button">
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.newButton}
          onPress={() => router.push('/(app)/passes/new')}
          accessibilityRole="button"
          accessibilityLabel="Create a new emergency pass"
        >
          <Text style={styles.newButtonText}>+ New pass</Text>
        </Pressable>
      </View>

      {status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0a4d8c" />
        </View>
      ) : status === 'error' ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh} style={styles.retryButton} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : passes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No passes yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first emergency pass so a responder can scan your QR code.
          </Text>
        </View>
      ) : (
        <FlatList
          data={passes}
          keyExtractor={(pass) => pass.passId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
          renderItem={({ item }) => (
            <PassListItem pass={item} onPress={(passId) => router.push(`/(app)/passes/${passId}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1220',
  },
  signOut: {
    fontSize: 13,
    color: '#4b5565',
    textDecorationLine: 'underline',
  },
  newButton: {
    backgroundColor: '#0a4d8c',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: 40,
    justifyContent: 'center',
  },
  newButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    color: '#8a231c',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0a4d8c',
  },
  retryText: {
    color: '#0a4d8c',
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0b1220',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5565',
    textAlign: 'center',
  },
});
