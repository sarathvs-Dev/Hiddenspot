import { semanticColors, spacing } from '@hiddenspot/shared';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Five tappable stars. Announced as a radio group, so screen readers hear "3 stars, selected". */
export function StarRatingInput({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (rating: number) => void;
  error?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === star }}
            accessibilityLabel={`${star} ${star === 1 ? 'star' : 'stars'}, ${LABELS[star]}`}
            style={({ pressed }) => [styles.star, pressed && styles.pressed]}
          >
            <Icon
              name={star <= value ? 'star-filled' : 'star'}
              size="xl"
              color={
                star <= value
                  ? semanticColors.rating
                  : error
                    ? semanticColors.danger
                    : semanticColors.borderInput
              }
            />
          </Pressable>
        ))}
      </View>
      <Text variant="label" tone={value ? 'primary' : 'tertiary'}>
        {value ? LABELS[value] : 'Tap to rate'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.xs },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.92 }] },
});
