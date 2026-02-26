import { useEffect, useState } from 'react';
import { trackPlaybackEvent, calculateUserEngagementScore } from '@/lib/recommendations';

export function useRecommendations(userId: string | null) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  async function loadRecommendations() {
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`${apiBase}/api/recommendations?${params.toString()}`);
      const result = await response.json();

      if (result.data) {
        setRecommendations(result.data);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  return { recommendations, loading };
}

export function useContinueWatching(userId: string | null) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadContinueWatching();
    }
  }, [userId]);

  async function loadContinueWatching() {
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${apiBase}/api/recommendations?type=continue&userId=${userId}&limit=10`);
      const result = await response.json();
      if (result.data) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Error loading continue watching:', error);
    } finally {
      setLoading(false);
    }
  }

  return { items, loading, refresh: loadContinueWatching };
}

export function useContentBased(filmId: string, userId: string | null) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSimilar();
  }, [filmId, userId]);

  async function loadSimilar() {
    if (!filmId) return;
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${apiBase}/api/recommendations?type=similar&filmId=${filmId}&limit=10`);
      const result = await response.json();
      if (result.data) {
        setRecommendations(result.data);
      }
    } catch (error) {
      console.error('Error loading similar content:', error);
    } finally {
      setLoading(false);
    }
  }

  return { recommendations, loading };
}

export function usePlaybackTracking(userId: string | null, filmId: string) {
  const sessionId = Math.random().toString(36).substr(2, 9);

  const trackEvent = (
    eventType: 'play' | 'pause' | 'resume' | 'seek' | 'complete',
    timeSeconds: number
  ) => {
    trackPlaybackEvent(userId, filmId, eventType, timeSeconds, sessionId);
  };

  return { trackEvent, sessionId };
}

export function useUserEngagement(userId: string | null) {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadEngagementScore();
    }
  }, [userId]);

  async function loadEngagementScore() {
    setLoading(true);
    try {
      const engagementScore = await calculateUserEngagementScore(userId!);
      setScore(engagementScore);
    } catch (error) {
      console.error('Error calculating engagement:', error);
    } finally {
      setLoading(false);
    }
  }

  return { score, loading };
}
