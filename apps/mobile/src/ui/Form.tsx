import { layout, radii, semanticColors, spacing, type CategoryId } from '@hiddenspot/shared';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from './Icon';
import { BottomSheet } from './Modal';
import { Text, useTypeStyle } from './Text';

/* ---------------- Validation message ---------------- */

const MESSAGE_STYLE: Record<'error' | 'success' | 'info', { icon: IconName; color: string }> = {
  error: { icon: 'alert-circle', color: semanticColors.danger },
  success: { icon: 'check-circle', color: semanticColors.success },
  info: { icon: 'info', color: semanticColors.info },
};

export function ValidationMessage({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info';
  children: string;
}) {
  const { icon, color } = MESSAGE_STYLE[tone];
  return (
    <View
      style={styles.message}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
    >
      <Icon name={icon} size="xs" color={color} />
      <Text variant="helper" style={[styles.flex, { color }]}>
        {children}
      </Text>
    </View>
  );
}

/* ---------------- Field wrapper ---------------- */

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FormField({
  label,
  hint,
  error,
  required,
  optional,
  children,
  style,
}: FormFieldProps) {
  return (
    <View style={[styles.field, style]}>
      <Text variant="label">
        {label}
        {required ? (
          <Text variant="label" tone="danger">
            {' '}
            *
          </Text>
        ) : null}
        {optional ? (
          <Text variant="label" tone="tertiary">
            {' '}
            (optional)
          </Text>
        ) : null}
      </Text>
      {children}
      {error ? (
        <ValidationMessage>{error}</ValidationMessage>
      ) : hint ? (
        <Text variant="helper" tone="secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/* ---------------- Text inputs ---------------- */

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  hint,
  error,
  required,
  optional,
  multiline,
  style,
  ...input
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const textStyle = useTypeStyle('body');
  const description = [label, required ? 'required' : undefined, error ?? hint]
    .filter(Boolean)
    .join(', ');

  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      style={style}
    >
      <TextInput
        placeholderTextColor={semanticColors.textTertiary}
        accessibilityLabel={description}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...input}
        onFocus={(event) => {
          setFocused(true);
          input.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          input.onBlur?.(event);
        }}
        style={[
          textStyle,
          styles.input,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      />
    </FormField>
  );
}

export function TextArea(props: Omit<TextFieldProps, 'multiline'>) {
  return <TextField {...props} multiline numberOfLines={4} />;
}

/* ---------------- Select (dropdown) ---------------- */

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string> {
  label: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Dropdown that opens a bottom sheet of options, easy to reach with one thumb. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choose an option',
  hint,
  error,
  required,
  style,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <FormField label={label} hint={hint} error={error} required={required} style={style}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.label ?? 'not selected'}`}
        accessibilityHint="Opens a list of options"
        style={({ pressed }) => [
          styles.input,
          styles.select,
          error ? styles.inputError : null,
          pressed && styles.pressed,
        ]}
      >
        <Text
          variant="body"
          tone={selected ? 'primary' : 'tertiary'}
          style={styles.flex}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size="sm" color={semanticColors.textSecondary} />
      </Pressable>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <View accessibilityRole="radiogroup">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body" style={styles.flex}>
                  {option.label}
                </Text>
                {isSelected ? <Icon name="check" size="md" color={semanticColors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </FormField>
  );
}

/* ---------------- Checkbox ---------------- */

export interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, description, checked, onChange, disabled }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => [
        styles.checkRow,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Icon name="check" size="xs" color={semanticColors.onPrimary} /> : null}
      </View>
      <View style={styles.flex}>
        <Text variant="label">{label}</Text>
        {description ? (
          <Text variant="helper" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Convenience options list for category dropdowns. */
export type CategoryOption = SelectOption<CategoryId>;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  field: { gap: 6 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  input: {
    minHeight: layout.touchTarget + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: semanticColors.borderInput,
    borderRadius: radii.md,
    backgroundColor: semanticColors.surface,
    color: semanticColors.textPrimary,
  },
  multiline: { minHeight: 112 },
  inputFocused: {
    borderColor: semanticColors.focusRing,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
  },
  inputError: { borderColor: semanticColors.danger },
  select: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.touchTarget + 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionSelected: { backgroundColor: semanticColors.primarySubtle },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: layout.touchTarget,
    paddingVertical: 10,
  },
  box: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: semanticColors.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.surface,
  },
  boxChecked: { backgroundColor: semanticColors.primary, borderColor: semanticColors.primary },
});
