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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f7', color: '#8a8a8a' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>{value}</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a', padding: '24px 20px 120px', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Insights</h2>

      {data.totalMeals === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontSize: 16, color: '#8a8a8a', marginBottom: 8 }}>No meals tracked yet</p>
          <p style={{ fontSize: 14, color: '#b0ada8' }}>Start your first meal to see insights!</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <StatCard label="Meals tracked" value={data.totalMeals.toString()} />
            <StatCard label="Avg duration" value={`${Math.round(data.avgMealDurationMin)} min`} />
            <StatCard label="Avg fullness" value={data.avgFinalFullness.toFixed(1)} />
            <StatCard label="Overshot rate" value={`${Math.round(data.overshotRate * 100)}%`} />
          </div>

          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Context</h3>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {[
              ['Home overshoot', `${Math.round(data.contextBreakdown.homeOvershotRate * 100)}%`],
              ['Restaurant overshoot', `${Math.round(data.contextBreakdown.restaurantOvershotRate * 100)}%`],
              ['Solo overshoot', `${Math.round(data.contextBreakdown.aloneOvershotRate * 100)}%`],
              ['With others overshoot', `${Math.round(data.contextBreakdown.withPeopleOvershotRate * 100)}%`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eeeb' }}>
                <span style={{ fontSize: 14, color: '#8a8a8a' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{value}</span>
              </div>
            ))}
          </div>

          {data.recommendations.length > 0 && (
            <>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Insights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.recommendations.map((rec, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.15)', borderRadius: 12, padding: 14, fontSize: 13, color: '#0d7377' }}>
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
