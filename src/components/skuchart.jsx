
import React, { useState, useMemo } from 'react';
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
  ThemeIcon,
  Grid,
  Card,
  SegmentedControl,
} from '@mantine/core';
import { Info, Package, Box as BoxIcon } from 'lucide-react';
import '../styles/skuchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// label helpers
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels   = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));

// palette
const colorPalette = ['#003f5c','#58508d','#bc5090','#ff6361','#ffa600','#26547D','#EF476F','#06D6A0','#FFD166'];

function SKUChart() {
  // redux filters
  const orders          = useSelector((s) => s.orders);
  const filterSku       = useSelector((s) => s.filterSku);
  const filterGender    = useSelector((s) => s.filterGender);
  const filterStatus    = useSelector((s) => s.filterStatus);
  const filterStartDate = useSelector((s) => s.filterStartDate);
  const filterEndDate   = useSelector((s) => s.filterEndDate);

  // local state
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'weekday'

  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // ───────────────────────────────────────── filtered orders
  const filtered = useMemo(() => {
    const byDate = orders.filter((o) => {
      const raw = o.delivered_date || o.return_date || o.shipped_at;
      return raw && dayjs(raw).isSameOrAfter(startDate) && dayjs(raw).isSameOrBefore(endDate);
    });

    return byDate.filter((o) => {
      if (filterSku    !== 'All' && o.sku !== filterSku) return false;
      if (filterGender !== 'All' && (o.gender || '').toLowerCase() !== filterGender.toLowerCase()) return false;
      if (filterStatus !== 'All' && o.status !== filterStatus) return false;
      return true;
    });
  }, [orders, filterSku, filterGender, filterStatus, startDate, endDate]);

  // distinct years
  const years = useMemo(
    () =>
      Array.from(
        new Set(
          filtered.map((o) =>
            dayjs(o.delivered_date || o.return_date || o.shipped_at).year(),
          ),
        ),
      ).sort(),
    [filtered],
  );

  // ───────────────────────────────────────── aggregation
  const {
    chartData,
    series,
    uniqueSkus,
    labelKey,
    labels,
    skuMonthlyData,
    totalSkuOrders,
    peakSkuLabel,
    peakSkuMonthPerSku,
  } = useMemo(() => {
    const lbls   = viewMode === 'month' ? monthLabels : weekdayLabels;
    const lk     = viewMode === 'month' ? 'month' : 'day';

    const uniques = [...new Set(filtered.map((o) => o.sku))];

    // create counters
    const skuData = lbls.reduce((acc, l) => ({ ...acc, [l]: {} }), {});

    filtered.forEach((o) => {
      const d   = dayjs(o.delivered_date || o.return_date || o.shipped_at);
      const lbl = viewMode === 'month' ? d.format('MMM') : d.format('ddd');
      const sku = o.sku;
      skuData[lbl][sku] = (skuData[lbl][sku] || 0) + 1;
    });

    const dataArr = lbls.map((l) => {
      const obj = { [lk]: l };
      uniques.forEach((sku) => {
        obj[sku] = skuData[l][sku] || 0;
      });
      return obj;
    });

    const ser = uniques.map((sku, i) => ({
      name: sku,
      color: colorPalette[i % colorPalette.length],
    }));

    const totOrders = {};
    uniques.forEach((sku) => {
      totOrders[sku] = filtered.filter((o) => o.sku === sku).length;
    });

    // peak label (overall)
    const overallCounts = lbls.map((l) =>
      Object.values(skuData[l]).reduce((sum, v) => sum + v, 0),
    );
    const peakIdx = overallCounts.indexOf(Math.max(...overallCounts));
    const peakLbl = lbls[peakIdx];

    // peak month/day per sku
    const peakPerSku = {};
    uniques.forEach((sku) => {
      const best = lbls.reduce(
        (max, l) =>
          (skuData[l][sku] || 0) > max.count
            ? { label: l, count: skuData[l][sku] || 0 }
            : max,
        { label: 'N/A', count: 0 },
      );
      peakPerSku[sku] = best;
    });

    return {
      chartData: dataArr,
      series: ser,
      uniqueSkus: uniques,
      labelKey: lk,
      labels: lbls,
      skuMonthlyData: skuData,
      totalSkuOrders: totOrders,
      peakSkuLabel: peakLbl,
      peakSkuMonthPerSku: peakPerSku,
    };
  }, [filtered, viewMode]);

  // ───────────────────────────────────────── tooltip
  const CustomTooltip = ({ label, payload }) => {
    if (!payload?.length) return null;

    const matchLabel = (d) =>
      viewMode === 'month'
        ? d.format('MMM') === label
        : d.format('ddd') === label;

    return (
      <Paper p="sm" withBorder shadow="sm">
        <Text fw={500} mb="xs">{label}</Text>
        {payload.map((entry) => (
          <Group key={entry.name} position="apart" mb="xs">
            <Badge variant="light" color="blue">{entry.name}</Badge>
            <Text>{entry.value} orders</Text>
          </Group>
        ))}
        {filterSku !== 'All' &&
          years.map((y) => {
            const count = filtered.filter((o) => {
              const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
              return (
                o.sku === filterSku &&
                matchLabel(d) &&
                d.year() === y
              );
            }).length;
            return count ? (
              <Group key={y} position="apart" ml="lg" mb="xs">
                <Text size="xs" c="dimmed">{y}</Text>
                <Badge size="xs" color="green">{count}</Badge>
              </Group>
            ) : null;
          })}
      </Paper>
    );
  };

  // ───────────────────────────────────────── render
  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color="black">
            <Package size={20} />
          </ThemeIcon>
          <Title order={3}>SKU Analysis</Title>
        </Group>
        <SegmentedControl
          size="xs"
          value={viewMode}
          onChange={setViewMode}
          data={[
            { label: 'Monthly', value: 'month' },
            { label: 'Weekday', value: 'weekday' },
          ]}
        />
      </Group>

      {/* summary card (if specific SKU selected) */}
      <Group position="center" mb="md">
        {filterSku !== 'All' ? (
          <Card
            shadow="sm"
            p="sm"
            radius="md"
            withBorder
            style={{ width: '100%', maxWidth: 350 }}
          >
            <Group position="apart" mb={8}>
              <Text size="sm" fw={700}>{filterSku}</Text>
              <ThemeIcon color={colorPalette[0].replace('#','')} variant="light" radius="xl" size="sm">
                <BoxIcon size={14} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700} mb={12}>{totalSkuOrders[filterSku] || 0}</Text>
            <Group position="apart" spacing="xs" noWrap>
              <Text size="xs" c="dimmed">Peak</Text>
              <Badge color="blue" size="sm">{peakSkuMonthPerSku[filterSku]?.label}</Badge>
            </Group>
          </Card>
        ) : null}
      </Group>

      <BarChart
        h={300}
        data={chartData}
        dataKey={labelKey}
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        barSize={60}
        yAxisProps={{ domain: [0, 'dataMax'], tickLine: true, axisLine: true, stroke: '#E5E7EB', tickFormatter: (v) => v.toFixed(0) }}
        xAxisProps={{ stroke: '#E5E7EB' }}
        gridProps={{ vertical: false, horizontal: true, stroke: '#E5E7EB', opacity: 0.5 }}
        tickLine="y"
        withLegend={false}
        style={{ overflow: 'visible', '--chart-cursor-fill': '#f1f5f9', '--chart-grid-color': '#e2e8f0', '--chart-text-color': '#64748b' }}
      />

      {filterSku === 'All' && (
        <div className="sku-legend">
          {series.map(({ name, color }) => (
            <div key={name} className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: color }} />
              <span className="legend-label">{name}</span>
            </div>
          ))}
        </div>
      )}
    </Paper>
  );
}

// export both ways

export default SKUChart;
