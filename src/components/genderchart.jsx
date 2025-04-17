import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { LineChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '../styles/genderchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function GenderChart() {
  // 1) Récupération des données et des filtres depuis Redux
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);     
  const filterGender = useSelector((state) => state.filterGender); 
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate   = useSelector((state) => state.filterEndDate);

  // 2) Logs initiaux
  console.log('--- [GenderChart] Store filters ---');
  console.log('SKU:', filterSku, '| Gender:', filterGender, '| Status:', filterStatus);
  console.log('Date Range:', filterStartDate, '->', filterEndDate);
  console.log('orders.length =', orders.length);

  // 3) Convertir en dayjs pour le filtrage par date
  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // 4) Filtrer par date
  const filteredByDate = orders.filter((order, idx) => {
    const rawDate = order.delivered_date || order.return_date || order.shipped_at;
    if (!rawDate) {
      console.log(`[GenderChart #${idx}] Pas de date -> exclu`);
      return false;
    }

    const orderDate = dayjs(rawDate);
    console.log(`[GenderChart #${idx}] rawDate="${rawDate}" => parsed="${orderDate.format()}"`);
    return orderDate.isSameOrAfter(startDate) && orderDate.isSameOrBefore(endDate);
  });
  console.log('filteredByDate.length =', filteredByDate.length);

  // 5) Filtrer par SKU, Status, Gender
  const finalFilteredOrders = filteredByDate.filter((order, idx) => {
    if (filterSku !== 'All' && order.sku !== filterSku) return false;
    if (filterStatus !== 'All' && order.status !== filterStatus) return false;
    if (filterGender !== 'All' && order.gender?.toLowerCase() !== filterGender.toLowerCase()) {
      return false;
    }
    return true;
  });
  console.log('finalFilteredOrders.length =', finalFilteredOrders.length);

  // 6) Construire les buckets mensuels
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
  const genderMonthlyData = months.reduce((acc, month) => {
    acc[month] = { Male: 0, Female: 0 };
    return acc;
  }, {});

  // 7) Parcourir finalFilteredOrders
  finalFilteredOrders.forEach((order, idx) => {
    const { gender, delivered_date, return_date, shipped_at } = order;
    const date = delivered_date || return_date || shipped_at;
    if (!gender || !date) return;

    const month = dayjs(date).format('MMM');
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male') {
      genderMonthlyData[month].Male++;
    } else if (lowerGender === 'female') {
      genderMonthlyData[month].Female++;
    }
  });

  // 8) Construire chartData
  const chartData = months.map((month) => ({
    month,
    Male: genderMonthlyData[month].Male,
    Female: genderMonthlyData[month].Female,
  }));

  // 9) Choix des séries selon filterGender
  const series = [];
  if (filterGender === 'All' || filterGender.toLowerCase() === 'male') {
    series.push({ name: 'Male', color: '#2D9CDB' });
  }
  if (filterGender === 'All' || filterGender.toLowerCase() === 'female') {
    series.push({ name: 'Female', color: '#EB5757' });
  }

  // 10) Tooltip personnalisé
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {payload.map((entry, idx) => (
          <div key={idx} style={{ color: entry.color, marginTop: 5 }}>
            {entry.name}: <strong>{entry.value} Orders</strong>
          </div>
        ))}
      </div>
    );
  };

  // 11) Rendu final
  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse by Gender</h3>
      <LineChart
        h={400}
        data={chartData}
        dataKey="month"
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        yAxisProps={{
          domain: [0, 100],
          tickInterval: 10,
        }}
        curveType="linear"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray',
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

export default GenderChart;
