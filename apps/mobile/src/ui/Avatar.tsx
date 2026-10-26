import { avatarSizes, getInitials, pickAvatarColors, type AvatarSize } from '@hiddenspot/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

/** Anything with an id, a name and an optional photo, such as a DemoUser. */
export interface AvatarPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AvatarProps {
  person: AvatarPerson;
  size?: AvatarSize;
}

/** Photo avatar that falls back to coloured initials when there is no photo or it fails. */
export function Avatar({ person, size = 'md' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const dimension = avatarSizes[size];
  const colors = pickAvatarColors(person.id);
  const url = person.avatarUrl ?? null;
  const showImage = url !== null && failedUrl !== url;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={person.name}
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: colors.background,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setFailedUrl(url)}
          accessible={false}
        />
      ) : (
        <Text
          variant="label"
          style={{
            color: colors.foreground,
            fontSize: Math.round(dimension * 0.38),
            lineHeight: dimension,
          }}
        >
          {getInitials(person.name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
