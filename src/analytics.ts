import type { MealSession, AnalyticsSummary } from './types';
import { getAllSessions, getAllEvents } from './db';

export async function computeAnalytics(): Promise<AnalyticsSummary> {
  const sessions = await getAllSessions();
  const allEvents = await getAllEvents();

  const ended = sessions.filter((s) => s.status === 'ended');

  if (ended.length === 0) {
    return emptyAnalytics();
  }

  const durations = ended
    .filter((s) => s.endedAt)
    .map((s) => (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000);

  const finalFullnesses = ended
    .map((s) => s.finalSummary?.finalFullness)
    .filter((f): f is number => f != null);

  const overshotCount = ended.filter((s) => s.finalSummary?.overshot === true).length;

  // Time to first rating >= 7
  const timesTo7: number[] = [];
  for (const s of ended) {
    const events = allEvents.filter((e) => e.sessionId === s.id);
    const first7 = events.find(
      (e) => e.type === 'fullness_rated' && e.fullnessRating != null && e.fullnessRating >= 7,
    );
    if (first7) {
      const min = (new Date(first7.ts).getTime() - new Date(s.startedAt).getTime()) / 60000;
      timesTo7.push(min);
    }
  }

  // Avg response delay
  const delays = allEvents
    .filter((e) => e.type === 'fullness_rated' && e.responseDelayMs != null)
    .map((e) => e.responseDelayMs!);

  // Fullness slope for each session
  const slopes: number[] = [];
  for (const s of ended) {
    if (!s.endedAt) continue;
    const events = allEvents
      .filter((e) => e.sessionId === s.id && e.type === 'fullness_rated' && e.fullnessRating != null)
      .sort((a, b) => a.ts.localeCompare(b.ts));
    if (events.length >= 2) {
      const first = events[0].fullnessRating!;
      const last = events[events.length - 1].fullnessRating!;
      const durationMin = (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
      if (durationMin > 0) {
        slopes.push((last - first) / durationMin);
      }
    }
  }

  // Context breakdown
  const homeEnded = ended.filter((s) => s.context?.location === 'home');
  const restaurantEnded = ended.filter((s) => s.context?.location === 'restaurant');
  const aloneEnded = ended.filter((s) => s.context?.social === 'alone');
  const withPeopleEnded = ended.filter((s) => s.context?.social === 'with_people');

  const overshotRate = (arr: MealSession[]) =>
    arr.length > 0 ? arr.filter((s) => s.finalSummary?.overshot === true).length / arr.length : 0;

  const contextBreakdown = {
    homeOvershotRate: overshotRate(homeEnded),
    restaurantOvershotRate: overshotRate(restaurantEnded),
    aloneOvershotRate: overshotRate(aloneEnded),
    withPeopleOvershotRate: overshotRate(withPeopleEnded),
  };

  // Generate recommendations
  const recommendations = generateRecommendations(ended, contextBreakdown, timesTo7);

  return {
    totalMeals: ended.length,
    avgMealDurationMin: avg(durations),
    avgFinalFullness: avg(finalFullnesses),
    overshotRate: ended.length > 0 ? overshotCount / ended.length : 0,
    avgTimeToFullness7Min: avg(timesTo7),
    avgResponseDelayMs: avg(delays),
    avgFullnessSlope: avg(slopes),
    contextBreakdown,
    recommendations,
  };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function generateRecommendations(
  sessions: MealSession[],
  context: AnalyticsSummary['contextBreakdown'],
  timesTo7: number[],
): string[] {
  const recs: string[] = [];

  if (context.restaurantOvershotRate > context.homeOvershotRate + 0.15 && sessions.length >= 3) {
    recs.push('Restaurant meals have a higher overshoot rate than home meals. Consider setting a stricter prompt interval when dining out.');
  }

  if (context.withPeopleOvershotRate > context.aloneOvershotRate + 0.15 && sessions.length >= 3) {
    recs.push('Meals with others tend to have more overshooting. Social mode may help with gentler but persistent reminders.');
  }

  if (timesTo7.length >= 3) {
    const avgTo7 = avg(timesTo7);
    if (avgTo7 < 5) {
      recs.push(`You often reach fullness 7 within ${Math.round(avgTo7)} minutes. Consider a shorter first prompt interval.`);
    }
  }

  const overshotFromHigh = sessions.filter(
    (s) => s.finalSummary?.overshot && s.finalSummary?.finalFullness != null && s.finalSummary.finalFullness >= 8,
  );
  if (overshotFromHigh.length >= 2) {
    recs.push('Most of your overshoots happen at high fullness levels. Consider using a stricter unlock method.');
  }

  if (recs.length === 0 && sessions.length >= 2) {
    recs.push('Keep tracking meals to get personalized insights!');
  }

  return recs.slice(0, 3);
}

function emptyAnalytics(): AnalyticsSummary {
  return {
    totalMeals: 0,
    avgMealDurationMin: 0,
    avgFinalFullness: 0,
    overshotRate: 0,
    avgTimeToFullness7Min: 0,
    avgResponseDelayMs: 0,
    avgFullnessSlope: 0,
    contextBreakdown: {
      homeOvershotRate: 0,
      restaurantOvershotRate: 0,
      aloneOvershotRate: 0,
      withPeopleOvershotRate: 0,
    },
    recommendations: ['Start tracking meals to build your analytics!'],
  };
}
