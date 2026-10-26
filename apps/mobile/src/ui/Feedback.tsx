import {
  copy,
  durations,
  radii,
  semanticColors,
  shadows,
  spacing,
  palette,
  type Toast,
} from '@hiddenspot/shared';
import { useToast } from '@hiddenspot/shared/react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { easingFor, useReducedMotion } from './useReducedMotion';

/* ---------------- Empty and error states ---------------- */

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
  size?: 'page' | 'inline';
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'compass',
  title,
  message,
  action,
  size = 'page',
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.empty, size === 'inline' && styles.inline, style]}>
      <View style={[styles.emptyIcon, size === 'inline' && styles.emptyIconSmall]}>
        <Icon name={icon} size={size === 'page' ? 'lg' : 'md'} color={semanticColors.primary} />
      </View>
      <Text variant={size === 'page' ? 'h2' : 'h3'} align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" tone="secondary" align="center" style={styles.emptyMessage}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({
  onRetry,
  size,
  style,
}: {
  onRetry?: () => void;
  size?: EmptyStateProps['size'];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <EmptyState
      icon="alert-triangle"
      size={size}
      style={style}
      title={copy.errors.generic.title}
      message={copy.errors.generic.message}
      action={onRetry ? <Button onPress={onRetry}>{copy.actions.retry}</Button> : undefined}
    />
  );
}

/* ---------------- Toasts ---------------- */

const TOAST_ICONS: Record<Toast['tone'], IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'x-circle',
};

const TOAST_ACCENTS: Record<Toast['tone'], string> = {
  neutral: palette.sage300,
  info: palette.blue100,
  success: palette.forest300,
  warning: palette.amber300,
  danger: palette.red100,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const reducedMotion = useReducedMotion();
  const [enter] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: reducedMotion ? 0 : durations.slow,
      easing: easingFor('enter'),
      useNativeDriver: true,
    }).start();
  }, [enter, reducedMotion]);

  const accent = TOAST_ACCENTS[toast.tone];
  return (
    <Animated.View
      accessibilityLiveRegion={toast.tone === 'danger' ? 'assertive' : 'polite'}
      accessibilityRole={toast.tone === 'danger' ? 'alert' : 'summary'}
      style={[
        styles.toast,
        { borderLeftColor: accent },
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      <Icon name={TOAST_ICONS[toast.tone]} size="md" color={accent} />
      <View style={styles.toastText}>
        <Text variant="label" tone="inverse">
          {toast.title}
        </Text>
        {toast.message ? (
          <Text variant="bodySmall" tone="inverse" style={styles.toastMessage}>
            {toast.message}
          </Text>
        ) : null}
      </View>
      {toast.action ? (
        <Pressable
          onPress={() => {
            toast.action?.onPress();
            onDismiss();
          }}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.toastAction}
        >
          <Text variant="label" style={{ color: palette.amber300 }}>
            {toast.action.label}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={8}
        style={styles.toastClose}
      >
        <Icon name="x" size="sm" color={semanticColors.textInverse} />
      </Pressable>
    </Animated.View>
  );
}

/** Renders the shared toast queue. Mount once at the root; `bottomOffset` clears the tab bar. */
export function ToastViewport({ bottomOffset = spacing.xl }: { bottomOffset?: number }) {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={[styles.viewport, { bottom: bottomOffset }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  inline: {
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: semanticColors.borderStrong,
    borderRadius: radii.lg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.surfaceSecondary,
  },
  emptyIconSmall: { width: 48, height: 48, borderRadius: 24 },
  emptyMessage: { maxWidth: 320 },
  emptyAction: { marginTop: spacing.md },
  viewport: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    backgroundColor: semanticColors.surfaceInverse,
    boxShadow: shadows.lg,
  },
  toastText: { flex: 1, gap: 2 },
  toastMessage: { opacity: 0.85 },
  toastAction: { alignSelf: 'center', paddingHorizontal: spacing.sm, paddingVertical: 6 },
  toastClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
