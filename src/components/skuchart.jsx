import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '../styles/skuchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function SKUChart() {
  // 1) Récupération des données & filtres
  const orders          = useSelector((state) => state.orders);
  const filterSku       = useSelector((state) => state.filterSku);
  const filterGender    = useSelector((state) => state.filterGender);
  const filterStatus    = useSelector((state) => state.filterStatus);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate   = useSelector((state) => state.filterEndDate);

  // 2) Conversion en dayjs
  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // 3) Filtrer par date
  const filteredByDate = orders.filter((order) => {
    const rawDate = order.delivered_date || order.return_date || order.shipped_at;
    if (!rawDate) return false;
    const d = dayjs(rawDate);
    return d.isSameOrAfter(startDate) && d.isSameOrBefore(endDate);
  });

  // 4) Filtrer par SKU, Genre, Statut (global)
  const globalFiltered = filteredByDate.filter((order) => {
    if (filterSku    !== 'All' && order.sku      !== filterSku)    return false;
    if (filterGender !== 'All' && order.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    if (filterStatus !== 'All' && order.status   !== filterStatus) return false;
    return true;
  });

  // 5) Listes auxiliaires
  const months      = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
  const uniqueSkus  = [...new Set(globalFiltered.map(o => o.sku))];
  const uniqueYears = Array.from(
    new Set(
      globalFiltered.map((o) => dayjs(o.delivered_date||o.return_date||o.shipped_at).year())
    )
  ).sort();
  const colorPalette = ['#003f5c','#58508d','#bc5090','#ff6361','#ffa600','#26547D','#EF476F','#06D6A0','#FFD166'];

  // 6) Agrégation mois→SKU pour vue
  const skuMonthlyData = months.reduce((acc, m) => ({ ...acc, [m]: {} }), {});
  globalFiltered.forEach((order) => {
    const m = dayjs(order.delivered_date||order.return_date||order.shipped_at).format('MMM');
    const sku = order.sku;
    if (!sku) return;
    skuMonthlyData[m][sku] = (skuMonthlyData[m][sku]||0) + 1;
  });

  // 7) Construire chartData et séries (toujours par SKU)
  const chartData = months.map(m => {
    const obj = { month: m };
    uniqueSkus.forEach(sku => obj[sku] = skuMonthlyData[m][sku] || 0);
    return obj;
  });

  const series = uniqueSkus.map((sku, i) => ({ name: sku, color: colorPalette[i % colorPalette.length] }));

  // 8) Tooltip personnalisé: détail par année si un SKU est sélectionné
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {filterSku === 'All'
          ? payload.map((e, i) => (
              <div key={i} style={{ color: e.color, marginTop: 5 }}>
                {e.name} : <strong>{e.value} commandes</strong>
              </div>
            ))
          : (
            <>
              {/* Total mensuel pour le SKU */}
              {payload.map((e, i) => (
                <div key={i} style={{ color: e.color, marginTop: 5 }}>
                  {filterSku} : <strong>{e.value} commandes</strong>
                </div>
              ))}
              {/* Détail par année */}
              {uniqueYears.map((y, i) => {
                const count = globalFiltered.filter(order => {
                  const raw = order.delivered_date||order.return_date||order.shipped_at;
                  return order.sku === filterSku &&
                         dayjs(raw).format('MMM') === label &&
                         dayjs(raw).year() === y;
                }).length;
                return (
                  <div key={i} style={{ marginLeft: 16, marginTop: 4 }}>
                    {y} : <strong>{count} commandes</strong>
                  </div>
                );
              })}
            </>
          )
        }
      </div>
    );
  };

  // 9) Rendu
  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse par SKU</h3>
      <BarChart
        h={410}
        data={chartData}
        dataKey="month"
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        barSize={50}
        yAxisProps={{ domain: [0, 'dataMax'], tickLine: true }}
        tickLine="y"
      />
      <div className="sku-legend">
        {series.map(({ name, color }) => (
          <div key={name} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: color }} />
            <span className="legend-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
