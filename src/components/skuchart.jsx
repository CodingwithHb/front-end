import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { 
  Paper, 
  Group, 
  Text, 
  Badge, 
  Title, 
  Tooltip, 
  ActionIcon, 
  ThemeIcon,
  Grid,
  Card
} from '@mantine/core';
import { 
  BarChart2, 
  Info, 
  Box as BoxIcon 
} from 'lucide-react';
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

  // Additional statistics
  const totalSkuOrders = {};
  uniqueSkus.forEach(sku => {
    totalSkuOrders[sku] = globalFiltered.filter(o => o.sku === sku).length;
  });

  const peakSkuMonth = {};
  uniqueSkus.forEach(sku => {
    const monthData = months.map(m => ({
      month: m,
      count: skuMonthlyData[m][sku] || 0
    }));
    const peakMonth = monthData.reduce((max, curr) => 
      curr.count > max.count ? curr : max, 
      { month: 'N/A', count: 0 }
    );
    peakSkuMonth[sku] = peakMonth;
  });

  // 8) Tooltip personnalisé: détail par année si un SKU est sélectionné
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <Paper p="md" withBorder shadow="sm">
        <Text weight={500} mb="xs">{label}</Text>
        {payload.map((e, i) => (
          <Group key={i} position="apart" mb="xs">
            <Group>
              <Badge 
                color={filterSku === 'All' ? 'blue' : 'green'}
                variant="light"
              >
                {e.name}
              </Badge>
              <Text>{e.value} commandes</Text>
            </Group>
          </Group>
        ))}
        {filterSku !== 'All' && uniqueYears.map((y, i) => {
          const count = globalFiltered.filter(order => {
            const raw = order.delivered_date||order.return_date||order.shipped_at;
            return order.sku === filterSku &&
                   dayjs(raw).format('MMM') === label &&
                   dayjs(raw).year() === y;
          }).length;
          return count > 0 ? (
            <Group key={i} position="apart" ml="lg" mb="xs">
              <Text size="xs" color="dimmed">{y}</Text>
              <Badge size="xs" color="green">{count} commandes</Badge>
            </Group>
          ) : null;
        })}
      </Paper>
    );
  };

  // 9) Rendu
  return (
    <Paper p="md" shadow="sm">
      <Group position="apart" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <BarChart2 size={18} />
          </ThemeIcon>
          <Title order={3}>SKU Analysis</Title>
        </Group>
        <Tooltip label="Click bars for details">
          <ActionIcon><Info size={18} /></ActionIcon>
        </Tooltip>
      </Group>

      <Group position="center" mb="md" spacing="xl">
        {uniqueSkus.slice(0, 3).map((sku, index) => {
          // Calculate additional statistics
          const skuOrders = globalFiltered.filter(o => o.sku === sku);
          const deliveredOrders = skuOrders.filter(o => o.status === 'Delivered').length;
          const returnedOrders = skuOrders.filter(o => o.status === 'Return' || o.status === 'Returned').length;
          const returnRate = skuOrders.length > 0 
            ? ((returnedOrders / skuOrders.length) * 100).toFixed(1) 
            : '0.0';

          return (
            <Card 
              key={sku}
              shadow="sm" 
              p="md" 
              radius="md" 
              withBorder 
              style={{ 
                width: '350px', 
                display: 'flex', 
                flexDirection: 'column',
                padding: '15px'
              }}
            >
              <Group position="apart" mb="xs">
                <Text size="sm" weight={600} color="dark">{sku}</Text>
                <ThemeIcon 
                  color={colorPalette[index % colorPalette.length].replace('#', '')} 
                  variant="light" 
                  radius="xl" 
                  size="sm"
                >
                  <BoxIcon size={14} />
                </ThemeIcon>
              </Group>
              
              <Text 
                size="xl" 
                weight={700} 
                mb="md"
                color={colorPalette[index % colorPalette.length]}
              >
                {totalSkuOrders[sku]}
              </Text>
              
              <Group position="apart" mb="xs">
                <Text size="xs" color="dimmed">Delivered</Text>
                <Badge color="green" size="sm">{deliveredOrders}</Badge>
              </Group>
              
              <Group position="apart" mb="xs">
                <Text size="xs" color="dimmed">Returns</Text>
                <Badge color="red" size="sm">{returnedOrders}</Badge>
              </Group>
              
              <Group position="apart" mb="xs">
                <Text size="xs" color="dimmed">Peak Month</Text>
                <Badge 
                  color={colorPalette[index % colorPalette.length].replace('#', '')} 
                  size="sm"
                >
                  {peakSkuMonth[sku].month}
                </Badge>
              </Group>
              
              <Group position="apart">
                <Text size="xs" color="dimmed">Returns Rate</Text>
                <Badge 
                  color={returnRate > 10 ? "red" : "green"} 
                  size="sm"
                >
                  {returnRate}% Returns
                </Badge>
              </Group>
            </Card>
          );
        })}
      </Group>

      <BarChart
        h={300}
        data={chartData}
        dataKey="month"
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        barSize={60}
        yAxisProps={{ 
          domain: [0, 'dataMax'], 
          tickLine: true,
          axisLine: true,
          stroke: '#E5E7EB',
          tickFormatter: (value) => value.toFixed(0)
        }}
        xAxisProps={{
          stroke: '#E5E7EB',
        }}
        gridProps={{
          vertical: false,
          horizontal: true,
          stroke: '#E5E7EB',
          opacity: 0.5
        }}
        tickLine="y"
        withLegend={false}
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#f1f5f9',
          '--chart-grid-color': '#e2e8f0',
          '--chart-text-color': '#64748b',
        }}
      />

      <div className="sku-legend">
        {series.map(({ name, color }) => (
          <div key={name} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: color }} />
            <span className="legend-label">{name}</span>
          </div>
        ))}
      </div>
    </Paper>
  );
}