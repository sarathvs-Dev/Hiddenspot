import { copy, describeReference, radii, semanticColors, spacing } from '@hiddenspot/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocationContext } from '@/lib/location';
import { Button } from './Button';
import { Icon } from './Icon';
import { BottomSheet } from './Modal';
import { Text } from './Text';
import { ValidationMessage } from './Form';

/** Same wording on web and mobile. */
const STATUS_MESSAGES = copy.location;

/**
 * Pill showing where distances are measured from, with a sheet to change it.
 * Demo locations are always labelled as demo, never as the user's position.
 */
export function LocationSelector() {
  const { reference, presets, activePreset, deviceStatus, enableDeviceLocation, selectPreset } =
    useLocationContext();
  const [open, setOpen] = useState(false);
  const isDevice = reference?.kind === 'device';
  const label = reference
    ? isDevice
      ? 'Near you'
      : `${reference.label} · demo location`
    : 'Choose a location';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Distances measured from ${reference ? describeReference(reference) : 'nowhere yet'}. Change location`}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Icon name={isDevice ? 'navigation' : 'map-pin'} size="sm" color={semanticColors.primary} />
        <Text variant="label" tone="brand" numberOfLines={1} style={styles.flexShrink}>
          {label}
        </Text>
        <Icon name="chevron-down" size="sm" color={semanticColors.primary} />
      </Pressable>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Measure distances from"
        description="Used for nearby places and distance filters. Nothing is sent anywhere."
      >
        <Button
          variant={isDevice ? 'primary' : 'secondary'}
          leadingIcon="navigation"
          loading={deviceStatus === 'locating'}
          fullWidth
          onPress={() => void enableDeviceLocation()}
        >
          {isDevice ? 'Using your current location' : 'Use my current location'}
        </Button>
        {deviceStatus === 'denied' || deviceStatus === 'unavailable' ? (
          <ValidationMessage tone="info">{STATUS_MESSAGES[deviceStatus]}</ValidationMessage>
        ) : null}

        <View style={styles.group} accessibilityRole="radiogroup">
          <Text variant="overline" tone="secondary">
            Demo locations
          </Text>
          {presets.map((preset) => {
            const selected = !isDevice && activePreset?.id === preset.id;
            return (
              <Pressable
                key={preset.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  selectPreset(preset.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.flex}>
                  <Text variant="body">{preset.label}</Text>
                  <Text variant="caption" tone="secondary">
                    {preset.district} district · town centre
                  </Text>
                </View>
                {selected ? <Icon name="check" color={semanticColors.primary} /> : null}
              </Pressable>
            );
          })}
          <Text variant="helper" tone="tertiary">
            Demo locations are town centres checked against Wikipedia and OpenStreetMap. They are
            not your position.
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    maxWidth: '100%',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.primarySubtle,
  },
  pressed: { opacity: 0.85 },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  group: { gap: spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionSelected: { backgroundColor: semanticColors.primarySubtle },
});
