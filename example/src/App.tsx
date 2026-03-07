import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  buildBoxShadow,
  SquircleButton,
  SquircleView,
} from 'react-native-resquircle';

export default function App() {
  const boxShadow = buildBoxShadow([
    { x: 0, y: 2, blur: 0, spread: 10, color: 'rgb(255, 234, 0)', opacity: 12 },
    {
      x: 0,
      y: 7,
      blur: 0,
      spread: 10,
      color: 'rgb(255 , 255 , 0)',
      opacity: 10,
    },
    {
      x: 0,
      y: 16,
      blur: 0,
      spread: 10,
      color: 'rgb(255 , 255 , 0)',
      opacity: 6,
    },
    {
      x: 0,
      y: 29,
      blur: 0,
      spread: 10,
      color: 'rgb(255 , 255 , 0)',
      opacity: 2,
    },
    {
      x: 0,
      y: 46,
      blur: 0,
      spread: 10,
      color: 'rgb(255 , 255 , 0)',
      opacity: 0,
    },
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Basic</Text>
      <SquircleView cornerSmoothing={1} style={[styles.card, { boxShadow }]}>
        <Text style={styles.title}>SquircleView</Text>
        <Text style={styles.subtitle}>Native iOS + Android</Text>
      </SquircleView>

      <Text style={styles.sectionTitle}>Overflow hidden (clip)</Text>
      <SquircleView
        cornerSmoothing={1}
        overflow="hidden"
        style={[styles.card, styles.overflowCardWhite, { boxShadow }]}
      >
        <View style={styles.overflowRow}>
          <View style={styles.overflowBlob} />
          <Text style={styles.title}>Clipped blob</Text>
        </View>
        <Text style={styles.subtitle}>
          This big circle should be clipped by squircle.
        </Text>
      </SquircleView>

      <Text style={styles.sectionTitle}>Button</Text>
      <SquircleButton
        overflow="hidden"
        cornerSmoothing={1}
        style={[styles.button, { boxShadow }]}
      >
        {/* <View style={{backgroundColor: 'red', width: 400 , height: 300 , }}/> */}
        <Text style={styles.buttonText}>SquircleButton</Text>
      </SquircleButton>

      <Text style={styles.sectionTitle}>Smoothing</Text>
      <View style={styles.row}>
        <SquircleView
          cornerSmoothing={0}
          style={[styles.smoothingBox, styles.smoothing0]}
        >
          <Text style={styles.smoothingText}>0</Text>
        </SquircleView>
        <SquircleView
          cornerSmoothing={0.1}
          style={[styles.smoothingBox, styles.smoothing01]}
        >
          <Text style={styles.smoothingText}>0.1</Text>
        </SquircleView>
        <SquircleView
          cornerSmoothing={0.5}
          style={[styles.smoothingBox, styles.smoothing05]}
        >
          <Text style={styles.smoothingText}>0.5</Text>
        </SquircleView>
        <SquircleView
          cornerSmoothing={1}
          style={[styles.smoothingBox, styles.smoothing1]}
        >
          <Text style={styles.smoothingText}>1</Text>
        </SquircleView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    height: 120,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  overflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overflowBlob: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#111',
    opacity: 0.8,
  },
  button: {
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overflowCardWhite: {
    backgroundColor: 'rgb(255, 255, 255)',
  },
  smoothingBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smoothing0: { backgroundColor: '#4CAF50' },
  smoothing01: { backgroundColor: '#2196F3' },
  smoothing05: { backgroundColor: '#FF9800' },
  smoothing1: { backgroundColor: '#F44336' },
  smoothingText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
});
