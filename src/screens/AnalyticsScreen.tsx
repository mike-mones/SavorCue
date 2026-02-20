import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeAnalytics } from '../analytics';
import type { AnalyticsSummary } from '../types';

export default function AnalyticsScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    computeAnalytics().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Analytics</h2>
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 underline">
          Back
        </button>
      </div>

      {data.totalMeals === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No meals tracked yet</p>
          <p className="text-gray-400 dark:text-gray-500">Start your first meal to see analytics!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Meals tracked" value={data.totalMeals.toString()} />
            <StatCard label="Avg duration" value={`${Math.round(data.avgMealDurationMin)} min`} />
            <StatCard label="Avg final fullness" value={data.avgFinalFullness.toFixed(1)} />
            <StatCard label="Overshot rate" value={`${Math.round(data.overshotRate * 100)}%`} />
            <StatCard
              label="Avg time to fullness 7"
              value={data.avgTimeToFullness7Min > 0 ? `${Math.round(data.avgTimeToFullness7Min)} min` : '—'}
            />
            <StatCard
              label="Avg response delay"
              value={data.avgResponseDelayMs > 0 ? `${(data.avgResponseDelayMs / 1000).toFixed(1)}s` : '—'}
            />
          </div>

          {/* Context breakdown */}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">By context</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Home overshoot</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">
                {Math.round(data.contextBreakdown.homeOvershotRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Restaurant overshoot</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">
                {Math.round(data.contextBreakdown.restaurantOvershotRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Alone overshoot</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">
                {Math.round(data.contextBreakdown.aloneOvershotRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">With people overshoot</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">
                {Math.round(data.contextBreakdown.withPeopleOvershotRate * 100)}%
              </span>
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Insights</h3>
              <div className="space-y-2 mb-6">
                {data.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-200"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
