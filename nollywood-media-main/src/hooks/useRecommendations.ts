import { useEffect, useState } from 'react';
import {
  getHybridRecommendations,
  getContinueWatchingRecommendations,
  getColdStartRecommendations,
  getContentBasedRecommendations,
  trackPlaybackEvent,
  calculateUserEngagementScore
} from '@/lib/recommendations';

export function useRecommendations(userId: string | null) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      // Cold start for new/guest users
      loadColdStart();
    } else {
      loadPersonalizedRecommendations();
    }
  }, [userId]);

  async function loadPersonalizedRecommendations() {
    setLoading(true);
    try {
      const recs = await getHybridRecommendations(userId!, 15);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadColdStart() {
    setLoading(true);
    try {
      const recs = await getColdStartRecommendations(15);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading cold start:', error);
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
      const continueWatching = await getContinueWatchingRecommendations(userId!, 5);
      setItems(continueWatching);
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
    setLoading(true);
    try {
      const recs = await getContentBasedRecommendations(filmId, userId || undefined, 10);
      setRecommendations(recs);
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
