import { describe, expect, it } from 'vitest';
import { getKnowledgeZoomLevel, isKnowledgeMarkerLabelVisible } from './knowledge-world.utils';

describe('getKnowledgeZoomLevel', () => {
  it('shows the complete atom system from a distant camera', () => {
    expect(getKnowledgeZoomLevel(5.2)).toBe('system');
  });

  it('reveals orbit, clusters, and nodes as the camera approaches', () => {
    expect(getKnowledgeZoomLevel(4)).toBe('orbit');
    expect(getKnowledgeZoomLevel(3)).toBe('cluster');
    expect(getKnowledgeZoomLevel(2)).toBe('node');
  });

  it('keeps boundary values in the closer semantic level', () => {
    expect(getKnowledgeZoomLevel(4.35)).toBe('orbit');
    expect(getKnowledgeZoomLevel(3.25)).toBe('cluster');
    expect(getKnowledgeZoomLevel(2.35)).toBe('node');
  });
});

describe('isKnowledgeMarkerLabelVisible', () => {
  it('keeps knowledge labels hidden at system level', () => {
    expect(isKnowledgeMarkerLabelVisible('system', 'category')).toBe(false);
    expect(isKnowledgeMarkerLabelVisible('system', 'group')).toBe(false);
    expect(isKnowledgeMarkerLabelVisible('system', 'experience')).toBe(false);
  });

  it('reveals categories, clusters, and nodes progressively', () => {
    expect(isKnowledgeMarkerLabelVisible('orbit', 'category')).toBe(true);
    expect(isKnowledgeMarkerLabelVisible('orbit', 'group')).toBe(false);
    expect(isKnowledgeMarkerLabelVisible('cluster', 'group')).toBe(true);
    expect(isKnowledgeMarkerLabelVisible('cluster', 'experience')).toBe(false);
    expect(isKnowledgeMarkerLabelVisible('node', 'experience')).toBe(true);
  });
});
