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
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PackageCheck, 
  PackageX 
} from 'lucide-react';
import '../styles/chart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function Chart() {
  // Existing data filtering logic remains the same as in the previous implementation
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate = useSelector((state) => state.filterEndDate);

  const startDate = dayjs(filterStartDate);
  const endDate = dayjs(filterEndDate);

  // Filtering logic remains the same
  const filteredByDate = orders.filter((o) => {
    const date = o.delivered_date || o.return_date || o.shipped_at;
    return date && dayjs(date).isSameOrAfter(startDate) && dayjs(date).isSameOrBefore(endDate);
  });

  const data = filteredByDate.filter((o) => {
    if (filterSku !== 'All' && o.sku !== filterSku) return false;
    if (filterGender !== 'All' && o.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    if (filterStatus !== 'All' && o.status !== filterStatus) return false;
    return true;
  });

  // Months and chart data preparation
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));

  const monthlyTotals = months.reduce((acc, m) => ({
    ...acc,
    [m]: { Delivered: 0, Returned: 0 }
  }), {});

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

  // Statistics calculations
  const totalDelivered = data.filter(o => o.status === 'Delivered').length;
  const totalReturned = data.filter(o => o.status === 'Return' || o.status === 'Returned').length;
  const returnRate = totalDelivered > 0 ? (totalReturned / (totalDelivered + totalReturned) * 100).toFixed(1) : 0;
  
  // Peak month finding logic
  const findPeakMonth = (status) => {
    const statusData = {};
    months.forEach(m => {
      statusData[m] = monthlyTotals[m][status];
    });
    
    const maxCount = Math.max(...Object.values(statusData));
    if (maxCount === 0) return { month: 'N/A', count: 0 };
    
    const peakMonth = Object.keys(statusData).find(m => statusData[m] === maxCount);
    return { month: peakMonth, count: maxCount };
  };
  
  const deliveredPeak = findPeakMonth('Delivered');
  const returnedPeak = findPeakMonth('Returned');

  // Years present in the filtered data
  const years = Array.from(new Set(data.map((o) => 
    dayjs(o.delivered_date || o.return_date || o.shipped_at).year()))).sort();

  // Custom tooltip for the chart
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <Paper p="md" withBorder shadow="sm">
        <Text weight={500} mb="xs">{label}</Text>
        {payload.map((entry, idx) => {
          // Mapping entry.name to correct status
          const statusKey = entry.name === 'Returned' ? 'Return' : entry.name;
          return (
            <React.Fragment key={idx}>
              <Group position="apart" mb="xs">
                <Group>
                  <Badge 
                    color={entry.name === 'Delivered' ? 'green' : 'red'}
                    variant="light"
                  >
                    {entry.name}
                  </Badge>
                  <Text>{entry.value} commandes</Text>
                </Group>
              </Group>
              {years.map((y) => {
                const count = data.filter((o) => {
                  const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
                  return (
                    o.status === statusKey &&
                    d.format('MMM') === label &&
                    d.year() === y
                  );
                }).length;
                // Only display if count > 0
                if (count === 0) return null;
                return (
                  <Group key={y} position="apart" ml="lg" mb="xs">
                    <Text size="xs" color="dimmed">{y}</Text>
                    <Badge size="xs" color={entry.name === 'Delivered' ? 'green' : 'red'}>
                      {count} commandes
                    </Badge>
                  </Group>
                );
              })}
            </React.Fragment>
          );
        })}
      </Paper>
    );
  };

  return (
    <Paper p="md" shadow="sm">
      <Group position="apart" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <BarChart2 size={18} />
          </ThemeIcon>
          <Title order={3}>Order Status Analysis</Title>
        </Group>
        <Tooltip label="Click bars for details">
          <ActionIcon><Info size={18} /></ActionIcon>
        </Tooltip>
      </Group>

      <Grid gutter="md" mb="md" columns={3} align="stretch">
        <Grid.Col span={1}>
          <Card 
            shadow="sm" 
            p="xs" 
            radius="md" 
            withBorder 
            style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '100px' }}
          >
            <Group position="apart" mb="xs" px="xs" pt="xs">
              <Text size="xs" weight={500} color="dimmed">Total Deliveries</Text>
              <ThemeIcon color="green" variant="light" radius="xl" size="xs">
                <PackageCheck size={12} />
              </ThemeIcon>
            </Group>
            <Text size="md" weight={700} mt="auto" align="center">{totalDelivered}</Text>
            <Group position="apart" mt="xs" px="xs" pb="xs">
              <Text size="xs" color="dimmed">Peak Month</Text>
              <Badge color="green" size="xs">{deliveredPeak.month}</Badge>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={1}>
          <Card 
            shadow="sm" 
            p="xs" 
            radius="md" 
            withBorder 
            style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '100px' }}
          >
            <Group position="apart" mb="xs" px="xs" pt="xs">
              <Text size="xs" weight={500} color="dimmed">Total Returns</Text>
              <ThemeIcon color="red" variant="light" radius="xl" size="xs">
                <PackageX size={12} />
              </ThemeIcon>
            </Group>
            <Text size="md" weight={700} mt="auto" align="center">{totalReturned}</Text>
            <Group position="apart" mt="xs" px="xs" pb="xs">
              <Text size="xs" color="dimmed">Peak Month</Text>
              <Badge color="red" size="xs">{returnedPeak.month || 'N/A'}</Badge>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={1}>
          <Card 
            shadow="sm" 
            p="xs" 
            radius="md" 
            withBorder 
            style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '100px' }}
          >
            <Group position="apart" mb="xs" px="xs" pt="xs">
              <Text size="xs" weight={500} color="dimmed">Return Rate</Text>
              <ThemeIcon 
                color={returnRate > 10 ? "red" : "green"} 
                variant="light" 
                radius="xl" 
                size="xs"
              >
                {returnRate > 10 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </ThemeIcon>
            </Group>
            <Text 
              size="md" 
              weight={700} 
              mt="auto" 
              align="center"
              color={returnRate > 10 ? "red" : "green"}
            >
              {returnRate}%
            </Text>
            <Group position="apart" mt="xs" px="xs" pb="xs">
              <Text size="xs" color="dimmed">Status</Text>
              <Badge 
                color={returnRate > 10 ? "red" : "green"} 
                size="xs"
              >
                {returnRate > 10 ? "High" : "Low"}
              </Badge>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <BarChart
        h={300}
        data={chartData}
        dataKey="month"
        series={[
          { name: 'Delivered', color: '#22c55e' },
          { name: 'Returned', color: '#ef4444' },
        ]}
        tooltipProps={{ 
          shared: true, 
          content: CustomTooltip 
        }}
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
    </Paper>
  );
}