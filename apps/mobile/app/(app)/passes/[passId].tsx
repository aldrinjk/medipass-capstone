import { useLocalSearchParams } from 'expo-router';
import { PassDetailScreen } from '../../../features/passes/screens/PassDetailScreen';

export default function PassDetailRoute() {
  const { passId } = useLocalSearchParams<{ passId: string }>();
  if (!passId) return null;
  return <PassDetailScreen passId={passId} />;
}
