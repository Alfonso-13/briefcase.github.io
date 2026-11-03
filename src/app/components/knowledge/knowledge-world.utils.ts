export type KnowledgeZoomLevel = 'system' | 'orbit' | 'cluster' | 'node';
export type KnowledgeMarkerLevel = 'category' | 'group' | 'experience';

export function getKnowledgeZoomLevel(distance: number): KnowledgeZoomLevel {
  if (distance > 4.35) {
    return 'system';
  }
  if (distance > 3.25) {
    return 'orbit';
  }
  if (distance > 2.35) {
    return 'cluster';
  }
  return 'node';
}

export function isKnowledgeMarkerLabelVisible(
  zoomLevel: KnowledgeZoomLevel,
  markerLevel: KnowledgeMarkerLevel
): boolean {
  if (markerLevel === 'category') {
    return zoomLevel !== 'system';
  }
  if (markerLevel === 'group') {
    return zoomLevel === 'cluster' || zoomLevel === 'node';
  }
  return zoomLevel === 'node';
}
