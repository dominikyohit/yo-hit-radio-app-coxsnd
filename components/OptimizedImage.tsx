
import React, { useState } from 'react';
import { Image, View, StyleSheet, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

/**
 * OptimizedImage Component
 * 
 * Handles image loading with:
 * - Automatic fallback to placeholder on error
 * - Loading state
 * - Graceful error handling for slow networks
 */

interface OptimizedImageProps {
  source: string | number | ImageSourcePropType | undefined;
  fallbackSource?: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholderIcon?: string;
  placeholderIconMaterial?: string;
  placeholderColor?: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export function OptimizedImage({
  source,
  fallbackSource,
  style,
  resizeMode = 'cover',
  placeholderIcon = 'music.note',
  placeholderIconMaterial = 'music-note',
  placeholderColor = 'rgba(255, 215, 0, 0.3)',
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageSource = resolveImageSource(source);
  const hasFallback = fallbackSource !== undefined;

  // If image failed to load and we have a fallback, use it
  const displaySource = imageError && hasFallback ? fallbackSource : imageSource;

  // If no valid source or error without fallback, show placeholder
  const showPlaceholder = !imageSource.uri || (imageError && !hasFallback);

  if (showPlaceholder) {
    return (
      <View style={[styles.placeholder, style]}>
        <IconSymbol
          ios_icon_name={placeholderIcon}
          android_material_icon_name={placeholderIconMaterial}
          size={40}
          color={placeholderColor}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={displaySource}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={resizeMode}
        onError={(error) => {
          console.log('[OptimizedImage] Image load error:', error.nativeEvent.error);
          setImageError(true);
          setIsLoading(false);
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onLoadStart={() => {
          setIsLoading(true);
        }}
      />
      {isLoading && (
        <View style={[styles.loadingOverlay, style]}>
          <View style={styles.loadingPlaceholder} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
});
