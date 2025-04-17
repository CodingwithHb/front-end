import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '../styles/chart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function Chart() {
  // Données et filtres
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate = useSelector((state) => state.filterEndDate);

  const startDate = dayjs(filterStartDate);
  const endDate = dayjs(filterEndDate);

  // Filtrer par date
  const filteredByDate = orders.filter((o) => {
    const date = o.delivered_date || o.return_date || o.shipped_at;
    return date && dayjs(date).isSameOrAfter(startDate) && dayjs(date).isSameOrBefore(endDate);
  });

  // Filtrer selon SKU, genre et statut
  const data = filteredByDate.filter((o) => {
    if (filterSku !== 'All' && o.sku !== filterSku) return false;
    if (filterGender !== 'All' && o.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    if (filterStatus !== 'All' && o.status !== filterStatus) return false;
    return true;
  });

  // Axe X : mois simples
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));

  // Initialiser les totaux mensuels
  const monthlyTotals = months.reduce((acc, m) => ({
    ...acc,
    [m]: { Delivered: 0, Returned: 0 }
  }), {});

  // Compter les commandes
  data.forEach((o) => {
    const status = o.status;
    const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
    const m = d.format('MMM');
    if (!monthlyTotals[m]) return;
    if (status === 'Delivered') monthlyTotals[m].Delivered++;
    else if (status === 'Return' || status === 'Returned') monthlyTotals[m].Returned++;
  });

  const chartData = months.map((m) => ({
    month: m,
    Delivered: monthlyTotals[m].Delivered,
    Returned: monthlyTotals[m].Returned,
  }));

  // Années présentes
  const years = Array.from(new Set(data.map((o) => dayjs(o.delivered_date || o.return_date || o.shipped_at).year()))).sort();

  // Tooltip customisé
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {payload.map((entry, idx) => {
          // Mapping entry.name à valeur de status
          const statusKey = entry.name === 'Returned' ? 'Return' : entry.name;
          return (
            <React.Fragment key={idx}>
              <div style={{ color: entry.color, marginTop: 5 }}>
                {entry.name}: <strong>{entry.value} commandes</strong>
              </div>
              {years.map((y) => {
                const count = data.filter((o) => {
                  const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
                  return (
                    // comparer avec statusKey
                    o.status === statusKey &&
                    d.format('MMM') === label &&
                    d.year() === y
                  );
                }).length;
                // N'afficher que si count > 0
                if (count === 0) return null;
                return (
                  <div key={y} style={{ marginLeft: 16, marginTop: 4 }}>
                    {y}: <strong>{count} commandes</strong>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse par statut</h3>
      <BarChart
        h={400}
        data={chartData}
        dataKey="month"
        series={[
          { name: 'Delivered', color: '#7dd87d' },
          { name: 'Returned', color: '#bc2525' },
        ]}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        barSize={40}
        yAxisProps={{ domain: [0, 'dataMax'], tickLine: true }}
        tickLine="y"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray',
        }}
      />
      <div className="manual-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#7dd87d' }} />
          <span className="legend-label">Delivered</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#bc2525' }} />
          <span className="legend-label">Returned</span>
        </div>
      </div>
    </div>
  );
}
