import { copy, type IconButtonSize, type IconButtonVariant } from '@hiddenspot/shared';
import { useSavedPlaceIds, useToast } from '@hiddenspot/shared/react';
import { useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { IconButton } from './IconButton';
import { useReducedMotion } from './useReducedMotion';

export interface SaveButtonProps {
  placeId: string;
  placeName: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: StyleProp<ViewStyle>;
}

/**
 * Save toggle with toast feedback and undo. Persists through the data service.
 * The heart gives a short bounce when a place is saved, confirming the change.
 */
export function SaveButton({
  placeId,
  placeName,
  variant = 'soft',
  size = 'md',
  style,
}: SaveButtonProps) {
  const { isSaved, toggleSaved } = useSavedPlaceIds();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const saved = isSaved(placeId);

  const pop = () => {
    if (reducedMotion) return;
    scale.setValue(0.85);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    // The wrapper takes the positioning style so the bounce never moves the layout.
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <IconButton
        icon={saved ? 'heart-filled' : 'heart'}
        label={saved ? `Remove ${placeName} from saved` : `Save ${placeName}`}
        selected={saved}
        variant={variant}
        size={size}
        onPress={() => {
          const nowSaved = toggleSaved(placeId);
          if (nowSaved) pop();
          showToast({
            ...(nowSaved ? copy.toasts.saved(placeName) : copy.toasts.removed(placeName)),
            tone: nowSaved ? 'success' : 'neutral',
            action: nowSaved ? undefined : { label: 'Undo', onPress: () => toggleSaved(placeId) },
          });
        }}
      />
    </Animated.View>
  );
}
