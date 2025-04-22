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
import {
  TrendingUp,
  TrendingDown,
  PackageCheck,
  PackageX,
  Truck,
} from 'lucide-react';
import '../styles/chart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ───────────────────────────────────────── labels
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels   = Array.from({ length: 12 }, (_, i) =>
  dayjs().month(i).format('MMM'),
);

export default function Chart() {
  // ♦ Global filters
  const orders          = useSelector((s) => s.orders);
  const filterSku       = useSelector((s) => s.filterSku);
  const filterGender    = useSelector((s) => s.filterGender);
  const filterStatus    = useSelector((s) => s.filterStatus);
  const filterStartDate = useSelector((s) => s.filterStartDate);
  const filterEndDate   = useSelector((s) => s.filterEndDate);

  // ♦ Local state
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'weekday'

  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // ───────────────────────────────────────── filter orders
  const filtered = useMemo(() => {
    const byDate = orders.filter((o) => {
      const d = o.delivered_date || o.return_date || o.shipped_at;
      return (
        d &&
        dayjs(d).isSameOrAfter(startDate) &&
        dayjs(d).isSameOrBefore(endDate)
      );
    });

    return byDate.filter((o) => {
      if (filterSku    !== 'All' && o.sku !== filterSku) return false;
      if (filterGender !== 'All'
          && (o.gender || '').toLowerCase() !== filterGender.toLowerCase()
      ) return false;
      if (filterStatus !== 'All' && o.status !== filterStatus) return false;
      return true;
    });
  }, [orders, filterSku, filterGender, filterStatus, startDate, endDate]);

  // Years present in the filtered set
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

  // ───────────────────────────────────────── aggregate
  const {
    labelKey,
    peakLabelText,
    chartData,
    deliveredPeak,
    returnedPeak,
    totalDelivered,
    totalReturned,
    returnRate,
  } = useMemo(() => {
    const labels        = viewMode === 'month' ? monthLabels : weekdayLabels;
    const lk            = viewMode === 'month' ? 'month' : 'day';
    const peakText      = viewMode === 'month' ? 'Peak Month' : 'Peak Day';

    const counters = labels.reduce(
      (acc, l) => ({ ...acc, [l]: { Delivered: 0, Returned: 0 } }),
      {},
    );

    filtered.forEach((o) => {
      const d   = dayjs(o.delivered_date || o.return_date || o.shipped_at);
      const lbl = viewMode === 'month' ? d.format('MMM') : d.format('ddd');
      if (!counters[lbl]) return;
      if (o.status === 'Delivered')                       counters[lbl].Delivered += 1;
      if (o.status === 'Return' || o.status === 'Returned') counters[lbl].Returned  += 1;
    });

    const dataArr = labels.map((l) => ({
      [lk]: l,
      Delivered: counters[l].Delivered,
      Returned : counters[l].Returned,
    }));

    const totDel  = filtered.filter((o) => o.status === 'Delivered').length;
    const totRet  = filtered.filter((o) => ['Return','Returned'].includes(o.status)).length;
    const retRate = totDel ? ((totRet / (totDel + totRet)) * 100).toFixed(1) : 0;

    const peak = (key) => {
      const max = Math.max(...labels.map((l) => counters[l][key]));
      if (!max) return { label: 'N/A', count: 0 };
      return { label: labels.find((l) => counters[l][key] === max), count: max };
    };

    return {
      labelKey    : lk,
      peakLabelText: peakText,
      chartData   : dataArr,
      deliveredPeak: peak('Delivered'),
      returnedPeak : peak('Returned'),
      totalDelivered: totDel,
      totalReturned : totRet,
      returnRate   : retRate,
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
        {payload.map((entry) => {
          const statusKey = entry.name === 'Returned' ? 'Return' : entry.name;
          return (
            <React.Fragment key={entry.name}>
              <Group position="apart" mb="xs">
                <Badge
                  color={entry.name === 'Delivered' ? 'green' : 'red'}
                  variant="light"
                >
                  {entry.name}
                </Badge>
                <Text>{entry.value} orders</Text>
              </Group>

              {years.map((y) => {
                const count = filtered.filter((o) => {
                  const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
                  return (
                    o.status === statusKey &&
                    matchLabel(d) &&
                    d.year() === y
                  );
                }).length;

                return count ? (
                  <Group key={y} position="apart" ml="lg" mb="xs">
                    <Text size="xs" c="dimmed">{y}</Text>
                    <Badge
                      size="xs"
                      color={entry.name === 'Delivered' ? 'green' : 'red'}
                    >
                      {count}
                    </Badge>
                  </Group>
                ) : null;
              })}
            </React.Fragment>
          );
        })}
      </Paper>
    );
  };

  // ───────────────────────────────────────── render
  return (
    <Paper p="md" shadow="sm">
      {/* header + mode toggle */}
      <Group justify="space-between" mb="md">
        <Group>
          <ThemeIcon
            size="lg"
            radius="md"
            variant="light"
            color="green"
          >
            <Truck size={20} />
          </ThemeIcon>
          <Title order={3}>Order Status Analysis</Title>
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

      {/* KPI cards */}
      <Grid mb="md" columns={3} gutter="md">
        {/* delivered */}
        <Grid.Col span={1}>
          <Card p="xs" radius="md" withBorder shadow="sm" style={{ flex: 1 }}>
            <Group position="apart" mb="xs" px="xs" pt="xs">
              <Text size="xs" fw={500} c="dimmed">
                Total Deliveries
              </Text>
              <ThemeIcon color="green" variant="light" radius="xl" size="xs">
                <PackageCheck size={12} />
              </ThemeIcon>
            </Group>
            <Text size="md" fw={700} ta="center" mt="auto">
              {totalDelivered}
            </Text>
            <Group position="apart" mt="xs" px="xs" pb="xs">
              <Text size="xs" c="dimmed">
                {peakLabelText}
              </Text>
              <Badge color="green" size="xs">
                {deliveredPeak.label}
              </Badge>
            </Group>
          </Card>
        </Grid.Col>

        {/* returned */}
        <Grid.Col span={1}>
          <Card p="xs" radius="md" withBorder shadow="sm" style={{ flex: 1 }}>
            <Group position="apart" mb="xs" px="xs" pt="xs">
              <Text size="xs" fw={500} c="dimmed">
                Total Returns
              </Text>
              <ThemeIcon color="red" variant="light" radius="xl" size="xs">
                <PackageX size={12} />
              </ThemeIcon>
            </Group>
            <Text size="md" fw={700} ta="center" mt="auto">
              {totalReturned}
            </Text>
            <Group position="apart" mt="xs" px="xs" pb="xs">
              <Text size="xs" c="dimmed">
                {peakLabelText}
              </Text>
              <Badge color="red" size="xs">
                {returnedPeak.label}
              </Badge>
            </Group>
          </Card>
        </Grid.Col>

        {/* return‑rate */}
        <Grid.Col span={1}>
          <Card p="xs" radius="md" withBorder shadow="sm" style={{ flex: 1 }}>
            <Group position="apart" mb="xs" px="xs" pt="xs">
              <Text size="xs" fw={500} c="dimmed">
                Return Rate
              </Text>
              <ThemeIcon
                color={returnRate > 10 ? 'red' : 'green'}
                variant="light"
                radius="xl"
                size="xs"
              >
                {returnRate > 10 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
              </ThemeIcon>
            </Group>
            <Text
              size="md"
              fw={700}
              ta="center"
              mt="auto"
              c={returnRate > 10 ? 'red' : 'green'}
            >
              {returnRate}%
            </Text>
            <Group position="apart" mt="xs" px="xs" pb="xs">
              <Text size="xs" c="dimmed">
                Status
              </Text>
              <Badge color={returnRate > 10 ? 'red' : 'green'} size="xs">
                {returnRate > 10 ? 'High' : 'Low'}
              </Badge>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* bar chart */}
      <BarChart
        h={300}
        data={chartData}
        dataKey={labelKey}
        series={[
          { name: 'Delivered', color: '#22c55e' },
          { name: 'Returned',  color: '#ef4444' },
        ]}
        barSize={60}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        yAxisProps={{
          domain: [0, 'dataMax'],
          tickLine: true,
          axisLine: true,
          stroke: '#E5E7EB',
          tickFormatter: (v) => v.toFixed(0),
        }}
        xAxisProps={{ stroke: '#E5E7EB' }}
        gridProps={{
          vertical: false,
          horizontal: true,
          stroke: '#E5E7EB',
          opacity: 0.5,
        }}
        tickLine="y"
        withLegend={false}
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#f1f5f9',
          '--chart-grid-color' : '#e2e8f0',
          '--chart-text-color' : '#64748b',
        }}
      />
    </Paper>
  );
}
