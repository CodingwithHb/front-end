import React from 'react';
import { useSelector } from 'react-redux';
import { LineChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '../styles/genderchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function GenderChart() {
  // Récupération des données et filtres
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate = useSelector((state) => state.filterEndDate);

  const startDate = dayjs(filterStartDate);
  const endDate = dayjs(filterEndDate);

  // Filtrer par date
  const filteredByDate = orders.filter(o => {
    const raw = o.delivered_date || o.return_date || o.shipped_at;
    return raw && dayjs(raw).isSameOrAfter(startDate) && dayjs(raw).isSameOrBefore(endDate);
  });

  // Filtrer par SKU, statut et genre
  const data = filteredByDate.filter(o => {
    if (filterSku !== 'All' && o.sku !== filterSku) return false;
    if (filterStatus !== 'All' && o.status !== filterStatus) return false;
    if (filterGender !== 'All' && o.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    return true;
  });

  // Axe X: mois simples
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));

  // Initialiser les totaux
  const monthly = months.reduce((acc, m) => ({
    ...acc,
    [m]: { Male: 0, Female: 0 }
  }), {});

  // Remplir les données
  data.forEach(o => {
    const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
    const m = d.format('MMM');
    const g = o.gender?.toLowerCase();
    if (monthly[m]) {
      if (g === 'male') monthly[m].Male++;
      else if (g === 'female') monthly[m].Female++;
    }
  });

  // Préparer chartData
  const chartData = months.map(m => ({
    month: m,
    ...monthly[m]
  }));

  // Identifier les années présentes
  const years = Array.from(
    new Set(
      data.map(o => dayjs(o.delivered_date || o.return_date || o.shipped_at).year())
    )
  ).sort();

  // Séries selon filtre genre
  const series = [];
  if (filterGender === 'All' || filterGender.toLowerCase() === 'male') series.push({ name: 'Male', color: '#2D9CDB' });
  if (filterGender === 'All' || filterGender.toLowerCase() === 'female') series.push({ name: 'Female', color: '#EB5757' });

  // Tooltip personnalisé avec détail par année
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {payload.map((entry, idx) => {
          const genderKey = entry.name;
          return (
            <React.Fragment key={idx}>
              <div style={{ color: entry.color, marginTop: 5 }}>
                {genderKey}: <strong>{entry.value} commandes</strong>
              </div>
              {years.map(y => {
                const count = data.filter(o => {
                  const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
                  return (
                    o.gender?.toLowerCase() === genderKey.toLowerCase() &&
                    d.format('MMM') === label &&
                    d.year() === y
                  );
                }).length;
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

  // Rendu
  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse par genre</h3>
      <LineChart
        h={400}
        data={chartData}
        dataKey="month"
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        yAxisProps={{ domain: [0, 'dataMax'], tickLine: true }}
        curveType="linear"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray'
        }}
      />
      <div className="manual-legend">
        {series.map(s => (
          <div className="legend-item" key={s.name}>
            <div className="legend-dot" style={{ backgroundColor: s.color }} />
            <span className="legend-label">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GenderChart
