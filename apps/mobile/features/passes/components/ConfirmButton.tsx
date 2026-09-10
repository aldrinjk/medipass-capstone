import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}

/**
 * A destructive/irreversible action requires a second, explicit tap before
 * it fires -- used for revoke/rotate so a stray tap can't invalidate a
 * patient's active QR code.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  loading = false,
  disabled = false,
  tone = 'default',
}: ConfirmButtonProps) {
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handlePress = () => {
    if (loading || disabled) return;

    if (!awaitingConfirm) {
      setAwaitingConfirm(true);
      resetTimer.current = setTimeout(() => setAwaitingConfirm(false), 4000);
      return;
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    setAwaitingConfirm(false);
    onConfirm();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        tone === 'danger' && styles.buttonDanger,
        awaitingConfirm && styles.buttonAwaiting,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={tone === 'danger' ? '#8a231c' : '#0a4d8c'} />
      ) : (
        <Text style={[styles.text, tone === 'danger' && styles.textDanger]}>
          {awaitingConfirm ? confirmLabel : label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0a4d8c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonDanger: {
    borderColor: '#b3261e',
  },
  buttonAwaiting: {
    backgroundColor: '#fff4ea',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a4d8c',
  },
  textDanger: {
    color: '#b3261e',
  },
});
