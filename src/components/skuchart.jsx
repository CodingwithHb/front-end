import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '../styles/skuchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function SKUChart() {
  // 1) Récupération des données & filtres
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate   = useSelector((state) => state.filterEndDate);

  // 2) Logs initiaux
  console.log('--- [SKUChart] Filters ---');
  console.log('SKU:', filterSku, '| Gender:', filterGender, '| Status:', filterStatus);
  console.log('Date Range:', filterStartDate, '->', filterEndDate);
  console.log('orders.length =', orders.length);

  // 3) Conversion en dayjs
  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // 4) Filtrer par date
  const filteredByDate = orders.filter((order, idx) => {
    const rawDate = order.delivered_date || order.return_date || order.shipped_at;
    if (!rawDate) {
      console.log(`[SKUChart #${idx}] Pas de date -> exclu`);
      return false;
    }

    const orderDate = dayjs(rawDate);
    console.log(`[SKUChart #${idx}] rawDate="${rawDate}" => parsed="${orderDate.format()}"`);
    return orderDate.isSameOrAfter(startDate) && orderDate.isSameOrBefore(endDate);
  });
  console.log('filteredByDate.length =', filteredByDate.length);

  // 5) Filtrer par SKU, Gender, Status
  const globalFilteredOrders = filteredByDate.filter((order, idx) => {
    if (filterSku !== 'All' && order.sku !== filterSku) return false;
    if (filterGender !== 'All' && order.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    if (filterStatus !== 'All' && order.status !== filterStatus) return false;
    return true;
  });
  console.log('globalFilteredOrders.length =', globalFilteredOrders.length);

  // 6) Logique locale de sélection SKU (vous aviez un second filtrage local, on garde le concept)
  const [selectedSku, setSelectedSku] = useState('All');

  // 7) Préparer l'agrégation par mois / SKU
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
  const skuMonthlyData = months.reduce((acc, month) => {
    acc[month] = {};
    return acc;
  }, {});

  globalFilteredOrders.forEach((order, idx) => {
    const { sku } = order;
    const rawDate = order.delivered_date || order.return_date || order.shipped_at;
    if (!sku || !rawDate) return;

    const month = dayjs(rawDate).format('MMM');
    if (!skuMonthlyData[month][sku]) {
      skuMonthlyData[month][sku] = 0;
    }
    skuMonthlyData[month][sku]++;
  });

  // 8) Construire le chartData
  const chartData = months.map(month => {
    const entry = { month };
    Object.keys(skuMonthlyData[month]).forEach(oneSku => {
      entry[oneSku] = skuMonthlyData[month][oneSku];
    });
    return entry;
  });

  // 9) Liste des SKUs
  const uniqueSkus = [...new Set(globalFilteredOrders.map(o => o.sku))];

  // 10) Couleurs
  const colorPalette = [
    '#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600',
    '#26547D', '#EF476F', '#06D6A0', '#FFD166',
  ];

  // 11) Séries principales
  const series = uniqueSkus.map((sku, index) => ({
    name: sku,
    color: colorPalette[index % colorPalette.length],
  }));

  // 12) Appliquer la sélection locale (selectedSku)
  const currentChartData =
    selectedSku === 'All'
      ? chartData
      : chartData.map(data => ({
          month: data.month,
          [selectedSku]: data[selectedSku] || 0,
        }));

  const currentSeries =
    selectedSku === 'All'
      ? series
      : (() => {
          const idx = uniqueSkus.indexOf(selectedSku);
          const color = idx >= 0 ? colorPalette[idx % colorPalette.length] : colorPalette[0];
          return [{ name: selectedSku, color }];
        })();

  // 13) Tooltip
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {payload.map((entry, i) => (
          <div key={i} style={{ color: entry.color, marginTop: 5 }}>
            {entry.name}: <strong>{entry.value} Orders</strong>
          </div>
        ))}
      </div>
    );
  };

  // 14) Rendu
  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse by SKU</h3>

      
      <BarChart
        h={410}
        data={currentChartData}
        dataKey="month"
        series={currentSeries}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        legendProps={{}}
        barSize={50}
        yAxisProps={{
          domain: [0, 100],
          tickInterval: 10,
        }}
        tickLine="y"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray',
        }}
      />

      <div className="sku-legend">
        {currentSeries.map(({ name, color }) => (
          <div key={name} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: color }} />
            <span className="legend-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SKUChart;
