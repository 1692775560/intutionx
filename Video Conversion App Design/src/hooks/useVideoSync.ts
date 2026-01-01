import { useEffect, useState } from 'react';
import { Timeline, TimelineSegment } from '../types/session';

export function useVideoSync(
  videoRef: React.RefObject<HTMLVideoElement>,
  timeline: Timeline | null
) {
  const [currentSegment, setCurrentSegment] = useState<TimelineSegment | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<[number, number] | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !timeline) return;

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;

      const segment = timeline.segments.find(
        (seg) => currentTime >= seg.startTime && currentTime < seg.endTime
      );

      if (segment) {
        setCurrentSegment(segment);

        if (segment.codeLines) {
          const [start, end] = segment.codeLines.split('-').map(Number);
          setHighlightedLines([start, end]);
        } else {
          setHighlightedLines(null);
        }
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef, timeline]);

  return { currentSegment, highlightedLines };
}
