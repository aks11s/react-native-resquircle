import React from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import { SquircleView, buildBoxShadow } from 'react-native-resquircle';

const multiShadow = buildBoxShadow([
  { x: 0, y: 6, blur: 20, spread: 0, color: '#000', opacity: 40 },
  { x: 0, y: 12, blur: 28, spread: 0, color: '#3B82F6', opacity: 35 },
  { x: 0, y: 2, blur: 8, spread: 0, color: '#8B5CF6', opacity: 45 },
]);

const BOX_SIZE = 168;
const GAP = 16;
const cols = 2;

type Props = {
  onBack: () => void;
  onMore?: () => void;
};

export default function FeaturesScreen({ onBack, onMore }: Props) {
  const gridWidth = cols * BOX_SIZE + (cols - 1) * GAP;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Features</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.grid, { width: gridWidth }]}>
        {/* 1. Normal - обычный View с borderRadius */}
        <View style={styles.boxWrapper}>
          <View style={[styles.box, styles.normalBox]}>
            <Text style={styles.boxLabel}>1</Text>
            <Text style={styles.boxTitle}>Normal</Text>
            <Text style={styles.boxSub}>borderRadius</Text>
          </View>
        </View>

        {/* 2. Squircle */}
        <View style={styles.boxWrapper}>
          <SquircleView
            cornerSmoothing={1}
            style={[styles.box, styles.squircleBox]}
          >
            <Text style={styles.boxLabel}>2</Text>
            <Text style={styles.boxTitle}>Squircle</Text>
            <Text style={styles.boxSub}>smooth corners</Text>
          </SquircleView>
        </View>

        {/* 3. Squircle + Multi-shadows */}
        <View style={styles.boxWrapper}>
          <SquircleView
            cornerSmoothing={1}
            style={[
              styles.box,
              styles.multiShadowBox,
              { boxShadow: multiShadow },
            ]}
          >
            <Text style={styles.boxLabel}>3</Text>
            <Text style={styles.boxTitle}>Multi</Text>
            <Text style={styles.boxSub}>shadows</Text>
          </SquircleView>
        </View>

        {/* 4. Squircle Overflow */}
        <View style={styles.boxWrapper}>
          <SquircleView
            cornerSmoothing={1}
            overflow="hidden"
            style={[styles.box, styles.overflowBox]}
          >
            <View style={styles.overflowBlob} />
            <View style={styles.overflowContent}>
              <Text style={styles.boxLabel}>4</Text>
              <Text style={[styles.boxTitle, styles.overflowText]}>
                Overflow
              </Text>
              <Text style={[styles.boxSub, styles.overflowText]}>clipped</Text>
            </View>
          </SquircleView>
        </View>

        {/* 5. Outline */}
        <View style={styles.boxWrapper}>
          <SquircleView
            cornerSmoothing={1}
            style={[styles.box, styles.outlineBox, styles.outlineProps]}
          >
            <Text style={styles.boxLabel}>5</Text>
            <Text style={styles.boxTitle}>Outline</Text>
            <Text style={styles.boxSub}>outlineColor etc</Text>
          </SquircleView>
        </View>

        {/* 6. Per-corner radius */}
        <View style={styles.boxWrapper}>
          <SquircleView
            cornerSmoothing={1}
            style={[styles.box, styles.cornerRadiusBox, styles.cornerRadii]}
          >
            <Text style={styles.boxLabel}>6</Text>
            <Text style={styles.boxTitle}>Corners</Text>
            <Text style={styles.boxSub}>per-corner radius</Text>
          </SquircleView>
        </View>
      </View>

      {onMore && (
        <Pressable style={styles.moreBtn} onPress={onMore}>
          <Text style={styles.moreText}>More examples →</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 24,
    color: '#64748b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: { width: 40 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    justifyContent: 'center',
  },
  boxWrapper: {
    width: BOX_SIZE,
    height: BOX_SIZE,
  },
  box: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 12,
    justifyContent: 'flex-end',
  },
  normalBox: {
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  squircleBox: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  multiShadowBox: {
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  overflowBox: {
    backgroundColor: '#EC4899',
    borderWidth: 2,
    borderColor: '#DB2777',
  },
  outlineBox: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  outlineProps: {
    outlineColor: '#059669',
    outlineWidth: 3,
    outlineOffset: 2,
    outlineStyle: 'solid',
  },
  cornerRadiusBox: {
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: '#0284C7',
  },
  cornerRadii: {
    borderTopLeftRadius: 48,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 48,
    borderBottomLeftRadius: 12,
  },
  overflowBlob: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FCD34D',
    opacity: 0.8,
  },
  overflowContent: {
    zIndex: 1,
  },
  boxLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  boxSub: {
    fontSize: 11,
    color: '#475569',
  },
  overflowText: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moreBtn: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  moreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
