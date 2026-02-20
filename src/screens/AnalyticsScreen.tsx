import { useEffect, useState } from 'react';
import { computeAnalytics } from '../analytics';
import type { AnalyticsSummary } from '../types';

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    computeAnalytics().then(setData);
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f', color: '#555' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16 }}>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#fafafa' }}>{value}</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fafafa', padding: '20px 20px 120px', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Analytics</h2>

      {data.totalMeals === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>No meals tracked yet</p>
          <p style={{ fontSize: 14, color: '#444' }}>Start your first meal to see analytics!</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <StatCard label="Meals tracked" value={data.totalMeals.toString()} />
            <StatCard label="Avg duration" value={`${Math.round(data.avgMealDurationMin)} min`} />
            <StatCard label="Avg fullness" value={data.avgFinalFullness.toFixed(1)} />
            <StatCard label="Overshot rate" value={`${Math.round(data.overshotRate * 100)}%`} />
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Context</h3>
          <div style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 24 }}>
            {[
              ['Home overshoot', `${Math.round(data.contextBreakdown.homeOvershotRate * 100)}%`],
              ['Restaurant overshoot', `${Math.round(data.contextBreakdown.restaurantOvershotRate * 100)}%`],
              ['Solo overshoot', `${Math.round(data.contextBreakdown.aloneOvershotRate * 100)}%`],
              ['With others overshoot', `${Math.round(data.contextBreakdown.withPeopleOvershotRate * 100)}%`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                <span style={{ fontSize: 14, color: '#888' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>{value}</span>
              </div>
            ))}
          </div>

          {data.recommendations.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Insights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.recommendations.map((rec, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: 14, fontSize: 13, color: '#4ade80' }}>
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
