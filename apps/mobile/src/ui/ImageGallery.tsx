import { palette, spacing } from '@hiddenspot/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { SpotImage } from './SpotImage';
import { Text } from './Text';

export interface GalleryImage {
  uri: string;
  alt: string;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  /** Side padding of the thumbnail row, to align with the screen gutter. */
  inset?: number;
}

/** Horizontal thumbnails that open a swipeable full-screen viewer. */
export function ImageGallery({ images, inset = spacing.xl }: ImageGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const thumbWidth = Math.min(160, (width - inset * 2) / 2.4);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  if (images.length === 0) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      >
        {images.map((image, i) => (
          <Pressable
            key={image.uri}
            onPress={() => setIndex(i)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Open photo ${i + 1} of ${images.length}: ${image.alt}`}
            style={({ pressed }) => [{ width: thumbWidth }, pressed && styles.pressed]}
          >
            <SpotImage uri={image.uri} alt="" ratio="gallery" rounded />
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={index !== null}
        animationType="fade"
        onRequestClose={() => setIndex(null)}
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.viewer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={index ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(item) => item.uri}
            onMomentumScrollEnd={onScrollEnd}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width, height }}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.full}
                  contentFit="contain"
                  accessibilityLabel={item.alt}
                  accessible
                />
              </View>
            )}
          />
          <View style={[styles.viewerTop, { top: insets.top + spacing.sm }]}>
            <Text variant="label" tone="onImage" accessibilityLiveRegion="polite">
              {(index ?? 0) + 1} of {images.length}
            </Text>
            <IconButton
              icon="x"
              label="Close photos"
              variant="glass"
              onPress={() => setIndex(null)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md },
  pressed: { opacity: 0.85 },
  viewer: { flex: 1, backgroundColor: palette.forest900 },
  full: { flex: 1 },
  viewerTop: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
