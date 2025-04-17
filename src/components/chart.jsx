import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '../styles/chart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function Chart() {
  // 1) Récupération des données et des filtres dans Redux
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate   = useSelector((state) => state.filterEndDate);

  // 2) Logs de débogage pour voir ce qui est dans le store
  console.log('--- Store Filters ---');
  console.log('SKU:', filterSku, '| Gender:', filterGender, '| Status:', filterStatus);
  console.log('Date range:', filterStartDate, '->', filterEndDate);
  console.log('orders.length =', orders.length);

  // 3) Conversion en objets dayjs
  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // 4) Filtrage par date
  const filteredByDate = orders.filter((order, idx) => {
    // Récupérer la date source
    const rawDate = order.delivered_date || order.return_date || order.shipped_at;
    if (!rawDate) {
      console.log(`[Order #${idx}] Aucune date -> exclu`);
      return false;
    }

    // Vérifier la conversion dayjs
    const orderDate = dayjs(rawDate);
    console.log(`[Order #${idx}] rawDate="${rawDate}" -> parsed="${orderDate.format()}"`);

    // Appliquer le filtrage
    return orderDate.isSameOrAfter(startDate) && orderDate.isSameOrBefore(endDate);
  });

  console.log('filteredByDate.length =', filteredByDate.length);

  // 5) Filtrage par SKU, Gender, Status
  const finalFilteredOrders = filteredByDate.filter((order, idx) => {
    // SKU
    if (filterSku !== 'All' && order.sku !== filterSku) {
      return false;
    }
    // Gender
    if (filterGender !== 'All' && order.gender?.toLowerCase() !== filterGender.toLowerCase()) {
      return false;
    }
    // Status
    if (filterStatus !== 'All' && order.status !== filterStatus) {
      return false;
    }
    return true;
  });

  console.log('finalFilteredOrders.length =', finalFilteredOrders.length);

  // 6) Construire les données pour le BarChart
  const monthlyData = Array.from({ length: 12 }, (_, index) => ({
    month: dayjs().month(index).format('MMM'),
    Delivered: 0,
    Returned: 0,
  }));

  finalFilteredOrders.forEach((order, idx) => {
    const status = order.status;
    const date = order.delivered_date || order.return_date || order.shipped_at;
    if (!date) return;

    const monthIndex = dayjs(date).month();
    if (status === 'Delivered') {
      monthlyData[monthIndex].Delivered++;
    } else if (status === 'Return') {
      monthlyData[monthIndex].Returned++;
    }
  });

  // 7) Tooltip personnalisé
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

  // 8) Rendu final
  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse by status</h3>

      {/* BarChart */}
      <BarChart
        h={400}
        data={monthlyData}
        dataKey="month"
        series={[
          { name: 'Delivered', color: '#7dd87d' },
          { name: 'Returned', color: '#bc2525' },
        ]}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        barSize={40}
        yAxisProps={{ domain: [0, 1000], tickInterval: 5 }}
        tickLine="y"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray'
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

export default Chart;
