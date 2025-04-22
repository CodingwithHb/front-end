
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LineChart } from '@mantine/charts';
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
import { Users, UserCheck, UserX } from 'lucide-react';
import '../styles/genderchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ───────────────────────────────────────── labels
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels   = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));

function GenderChart() {
  // ♦ redux filters
  const orders          = useSelector((s) => s.orders);
  const filterSku       = useSelector((s) => s.filterSku);
  const filterStatus    = useSelector((s) => s.filterStatus);
  const filterGender    = useSelector((s) => s.filterGender);
  const filterStartDate = useSelector((s) => s.filterStartDate);
  const filterEndDate   = useSelector((s) => s.filterEndDate);

  // ♦ local state
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'weekday'

  const startDate = dayjs(filterStartDate);
  const endDate   = dayjs(filterEndDate);

  // ───────────────────────────────────────── filter orders
  const filtered = useMemo(() => {
    const byDate = orders.filter((o) => {
      const raw = o.delivered_date || o.return_date || o.shipped_at;
      return raw && dayjs(raw).isSameOrAfter(startDate) && dayjs(raw).isSameOrBefore(endDate);
    });

    return byDate.filter((o) => {
      if (filterSku !== 'All' && o.sku !== filterSku) return false;
      if (filterStatus !== 'All' && o.status !== filterStatus) return false;
      if (filterGender !== 'All' && (o.gender || '').toLowerCase() !== filterGender.toLowerCase()) return false;
      return true;
    });
  }, [orders, filterSku, filterStatus, filterGender, startDate, endDate]);

  // distinct years
  const years = useMemo(() => Array.from(
    new Set(filtered.map(o => dayjs(o.delivered_date || o.return_date || o.shipped_at).year()))
  ).sort(), [filtered]);

  // ───────────────────────────────────────── aggregation
  const {
    chartData,
    series,
    totalMale,
    totalFemale,
    malePeakLabel,
    femalePeakLabel,
    labelKey,
    peakLabelText,
  } = useMemo(() => {
    const labels   = viewMode === 'month' ? monthLabels : weekdayLabels;
    const lk       = viewMode === 'month' ? 'month' : 'day';
    const peakText = viewMode === 'month' ? 'Peak Month' : 'Peak Day';

    const counters = labels.reduce((acc, l) => ({ ...acc, [l]: { male: 0, female: 0 } }), {});

    filtered.forEach((o) => {
      const d   = dayjs(o.delivered_date || o.return_date || o.shipped_at);
      const lbl = viewMode === 'month' ? d.format('MMM') : d.format('ddd');
      const g   = (o.gender || '').toLowerCase();
      if (!counters[lbl]) return;
      if (g === 'male')   counters[lbl].male   += 1;
      if (g === 'female') counters[lbl].female += 1;
    });

    const dataArr = labels.map((l) => ({
      [lk]: l,
      Male  : counters[l].male,
      Female: counters[l].female,
    }));

    const tMale   = filtered.filter(o => (o.gender || '').toLowerCase() === 'male').length;
    const tFemale = filtered.filter(o => (o.gender || '').toLowerCase() === 'female').length;

    const maxMale = Math.max(...labels.map(l => counters[l].male));
    const maxFem  = Math.max(...labels.map(l => counters[l].female));
    const peakMaleLabel = maxMale ? labels.find(l => counters[l].male === maxMale) : 'N/A';
    const peakFemLabel  = maxFem  ? labels.find(l => counters[l].female === maxFem) : 'N/A';

    const ser = [];
    if (filterGender === 'All' || filterGender.toLowerCase() === 'male')   ser.push({ name: 'Male',   color: '#2D9CDB' });
    if (filterGender === 'All' || filterGender.toLowerCase() === 'female') ser.push({ name: 'Female', color: '#EB5757' });

    return {
      chartData      : dataArr,
      series         : ser,
      totalMale      : tMale,
      totalFemale    : tFemale,
      malePeakLabel  : peakMaleLabel,
      femalePeakLabel: peakFemLabel,
      labelKey       : lk,
      peakLabelText  : peakText,
    };
  }, [filtered, viewMode, filterGender]);

  // ───────────────────────────────────────── tooltip
  const CustomTooltip = ({ label, payload }) => {
    if (!payload?.length) return null;
    const matchLabel = (d) => viewMode === 'month' ? d.format('MMM') === label : d.format('ddd') === label;

    return (
      <Paper p="sm" withBorder shadow="sm">
        <Text fw={500} mb="xs">{label}</Text>
        {payload.map(entry => {
          const gKey = entry.name; // Male / Female
          return (
            <React.Fragment key={gKey}>
              <Group position="apart" mb="xs">
                <Badge color={gKey === 'Male' ? 'blue' : 'red'} variant="light">{gKey}</Badge>
                <Text>{entry.value} orders</Text>
              </Group>
              {years.map(y => {
                const count = filtered.filter(o => {
                  const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
                  return (o.gender || '').toLowerCase() === gKey.toLowerCase() && matchLabel(d) && d.year() === y;
                }).length;
                return count ? (
                  <Group key={y} position="apart" ml="lg" mb="xs">
                    <Text size="xs" c="dimmed">{y}</Text>
                    <Badge size="xs" color={gKey === 'Male' ? 'blue' : 'red'}>{count}</Badge>
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
      <Group justify="space-between" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <Users size={20} />
          </ThemeIcon>
          <Title order={3}>Gender Analysis</Title>
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

      <Grid gutter="md" mb="md" columns={2}>
        <Grid.Col span={1}>
          <Card p="md" radius="md" withBorder shadow="sm" style={{ flex: 1 }}>
            <Group position="apart">
              <Text size="sm" fw={500} c="dimmed">Male Orders</Text>
              <ThemeIcon color="blue" variant="light" radius="xl" size="sm"><UserCheck size={14} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={700} c="blue">{totalMale}</Text>
            <Group position="apart">
              <Text size="xs" c="dimmed">{peakLabelText}</Text>
              <Badge color="blue" size="xs">{malePeakLabel}</Badge>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={1}>
          <Card p="md" radius="md" withBorder shadow="sm" style={{ flex: 1 }}>
            <Group position="apart">
              <Text size="sm" fw={500} c="dimmed">Female Orders</Text>
              <ThemeIcon color="red" variant="light" radius="xl" size="sm"><UserX size={14} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={700} c="red">{totalFemale}</Text>
            <Group position="apart">
              <Text size="xs" c="dimmed">{peakLabelText}</Text>
              <Badge color="red" size="xs">{femalePeakLabel}</Badge>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <LineChart
        h={300}
        data={chartData}
        dataKey={labelKey}
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        yAxisProps={{ domain: [0, 'dataMax'], tickLine: true, axisLine: true, stroke: '#E5E7EB', tickFormatter: v => v.toFixed(0) }}
        xAxisProps={{ stroke: '#E5E7EB' }}
        gridProps={{ vertical: false, horizontal: true, stroke: '#E5E7EB', opacity: 0.5 }}
        curveType="linear"
        style={{ overflow: 'visible', '--chart-cursor-fill': '#f1f5f9', '--chart-grid-color': '#e2e8f0', '--chart-text-color': '#64748b' }}
      />
    </Paper>
  );
}

// export both ways so you can `import GenderChart` or `import { GenderChart }`
export { GenderChart };
