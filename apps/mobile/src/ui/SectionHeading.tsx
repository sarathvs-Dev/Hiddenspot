import { spacing } from '@hiddenspot/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';

export interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  size?: 'page' | 'section' | 'subsection';
  style?: StyleProp<ViewStyle>;
}

const SIZE_VARIANT = { page: 'h1', section: 'h2', subsection: 'h3' } as const;

export function SectionHeading({
  title,
  eyebrow,
  description,
  action,
  size = 'section',
  style,
}: SectionHeadingProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        {eyebrow ? (
          <Text variant="overline" tone="brand">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant={SIZE_VARIANT[size]}>{title}</Text>
        {description ? (
          <Text variant="body" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  text: { flex: 1, gap: spacing.xs },
});
