import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

interface PassQrCodeProps {
  /** The pass's publicUrl -- and only that. Never pass patient data here. */
  publicUrl: string;
  size?: number;
}

/**
 * Renders a QR code that encodes `publicUrl` and nothing else. The prop is
 * deliberately named (and typed as) a single opaque URL string so this
 * component cannot accidentally be handed demographics/medical fields --
 * see docs/team-handoffs section 6.2 ("Do not embed patient demographics
 * or medical data in the QR payload").
 */
export function PassQrCode({ publicUrl, size = 220 }: PassQrCodeProps) {
  return (
    <View
      style={styles.frame}
      accessibilityRole="image"
      accessibilityLabel="QR code linking to this pass's public emergency summary"
    >
      <QRCode value={publicUrl} size={size} backgroundColor="#ffffff" color="#0b1220" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
