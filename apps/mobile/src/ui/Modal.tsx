import { durations, layout, radii, semanticColors, shadows, spacing } from '@hiddenspot/shared';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal as NativeModal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { easingFor, useReducedMotion } from './useReducedMotion';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "dialog" is centred. "sheet" slides up from the bottom, within thumb reach. */
  variant?: 'dialog' | 'sheet';
  footer?: ReactNode;
  /** Close on backdrop tap and Android back. Defaults to true. */
  dismissible?: boolean;
  children?: ReactNode;
}

/**
 * Animated modal used for dialogs and bottom sheets. Android back closes it,
 * VoiceOver focus stays inside, and motion is skipped when reduced motion is on.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  variant = 'dialog',
  footer,
  dismissible = true,
  children,
}: ModalProps) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [visible, setVisible] = useState(open);

  // Mount immediately when opening; unmount only after the exit animation finishes.
  if (open && !visible) setVisible(true);

  useEffect(() => {
    if (!visible) return;
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reducedMotion ? 0 : open ? durations.slow : durations.normal,
      easing: easingFor(open ? 'enter' : 'exit'),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !open) setVisible(false);
    });
    return () => animation.stop();
  }, [open, visible, progress, reducedMotion]);

  const isSheet = variant === 'sheet';
  const panelMotion = isSheet
    ? {
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [windowHeight * 0.6, 0],
            }),
          },
        ],
      }
    : {
        opacity: progress,
        transform: [
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
        ],
      };
  const wide = windowWidth >= 768;

  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissible) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.root, isSheet && !wide ? styles.rootSheet : styles.rootDialog]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible ? onClose : undefined}
            accessible={false}
            importantForAccessibility="no"
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            isSheet && !wide ? [styles.sheet, { paddingBottom: insets.bottom }] : styles.dialog,
            { maxHeight: windowHeight * 0.88 },
            panelMotion,
          ]}
        >
          {isSheet && !wide ? <View style={styles.handle} /> : null}
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text variant="h2">{title}</Text>
              {description ? (
                <Text variant="body" tone="secondary">
                  {description}
                </Text>
              ) : null}
            </View>
            <IconButton icon="x" label="Close" size="sm" onPress={onClose} />
          </View>
          {children ? (
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : null}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </NativeModal>
  );
}

/** Bottom sheet: the sheet variant of Modal, named for readability at call sites. */
export function BottomSheet(props: Omit<ModalProps, 'variant'>) {
  return <Modal {...props} variant="sheet" />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootSheet: { justifyContent: 'flex-end' },
  rootDialog: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  backdrop: { backgroundColor: semanticColors.overlay },
  panel: { backgroundColor: semanticColors.surface, boxShadow: shadows.lg, overflow: 'hidden' },
  sheet: { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, width: '100%' },
  dialog: { borderRadius: radii.xl, width: '100%', maxWidth: 480 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginTop: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  titles: { flex: 1, gap: spacing.xs },
  bodyScroll: { flexGrow: 0 },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: semanticColors.border,
    backgroundColor: semanticColors.background,
    minHeight: layout.touchTarget + spacing.lg * 2,
  },
});
