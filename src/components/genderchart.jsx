import React from 'react';
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
  Tooltip, 
  ActionIcon, 
  ThemeIcon,
  Grid,
  Card
} from '@mantine/core';
import { 
  LineChart as LineChartIcon, 
  Info, 
  UserCheck, 
  UserX, 
  Users
} from 'lucide-react';
import '../styles/genderchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function GenderChart() {
  // Data and filter retrieval
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStartDate = useSelector((state) => state.filterStartDate);
  const filterEndDate = useSelector((state) => state.filterEndDate);

  const startDate = dayjs(filterStartDate);
  const endDate = dayjs(filterEndDate);

  // Filter by date
  const filteredByDate = orders.filter(o => {
    const raw = o.delivered_date || o.return_date || o.shipped_at;
    return raw && dayjs(raw).isSameOrAfter(startDate) && dayjs(raw).isSameOrBefore(endDate);
  });

  // Filter by SKU, status, and gender
  const data = filteredByDate.filter(o => {
    if (filterSku !== 'All' && o.sku !== filterSku) return false;
    if (filterStatus !== 'All' && o.status !== filterStatus) return false;
    if (filterGender !== 'All' && o.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    return true;
  });

  // X-axis: months
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));

  // Initialize totals
  const monthly = months.reduce((acc, m) => ({
    ...acc,
    [m]: { Male: 0, Female: 0 }
  }), {});

  // Fill data
  data.forEach(o => {
    const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
    const m = d.format('MMM');
    const g = o.gender?.toLowerCase();
    if (monthly[m]) {
      if (g === 'male') monthly[m].Male++;
      else if (g === 'female') monthly[m].Female++;
    }
  });

  // Prepare chart data
  const chartData = months.map(m => ({
    month: m,
    ...monthly[m]
  }));

  // Identify present years
  const years = Array.from(
    new Set(
      data.map(o => dayjs(o.delivered_date || o.return_date || o.shipped_at).year())
    )
  ).sort();

  // Series based on gender filter
  const series = [];
  if (filterGender === 'All' || filterGender.toLowerCase() === 'male') 
    series.push({ name: 'Male', color: '#2D9CDB' });
  if (filterGender === 'All' || filterGender.toLowerCase() === 'female') 
    series.push({ name: 'Female', color: '#EB5757' });

  // Calculate total orders by gender
  const totalMale = data.filter(o => o.gender?.toLowerCase() === 'male').length;
  const totalFemale = data.filter(o => o.gender?.toLowerCase() === 'female').length;

  // Find peak months for each gender
  const malePeakMonth = months.reduce((peak, m) => 
    monthly[m].Male > monthly[peak].Male ? m : peak, 
    months[0]
  );
  const femalePeakMonth = months.reduce((peak, m) => 
    monthly[m].Female > monthly[peak].Female ? m : peak, 
    months[0]
  );

  // Custom tooltip with year details
  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <Paper p="md" withBorder shadow="sm">
        <Text weight={500} mb="xs">{label}</Text>
        {payload.map((entry, idx) => {
          const genderKey = entry.name;
          return (
            <React.Fragment key={idx}>
              <Group position="apart" mb="xs">
                <Group>
                  <Badge 
                    color={genderKey === 'Male' ? 'blue' : 'red'}
                    variant="light"
                  >
                    {genderKey}
                  </Badge>
                  <Text>{entry.value} commandes</Text>
                </Group>
              </Group>
              {years.map((y) => {
                const count = data.filter(o => {
                  const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
                  return (
                    o.gender?.toLowerCase() === genderKey.toLowerCase() &&
                    d.format('MMM') === label &&
                    d.year() === y
                  );
                }).length;
                return count > 0 ? (
                  <Group key={y} position="apart" ml="lg" mb="xs">
                    <Text size="xs" color="dimmed">{y}</Text>
                    <Badge size="xs" color={genderKey === 'Male' ? 'blue' : 'red'}>
                      {count} commandes
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

  return (
    <Paper p="md" shadow="sm" >
      <Group position="apart" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <Users size={20} />
          </ThemeIcon>
          <Title order={3}>Gender Analysis</Title>
        </Group>
        <Tooltip label="Click lines for details">
          <ActionIcon><Info size={18} /></ActionIcon>
        </Tooltip>
      </Group>

      <Grid gutter="md" mb="md" columns={2} align="stretch">
        <Grid.Col span={1}>
          <Card 
            shadow="sm" 
            p="md" 
            radius="md" 
            withBorder 
            style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Group position="apart">
              <Text size="sm" weight={500} color="dimmed">Male Orders</Text>
              <ThemeIcon color="blue" variant="light" radius="xl" size="sm">
                <UserCheck size={14} />
              </ThemeIcon>
            </Group>
            
            <Text 
              size="xl" 
              weight={700}
              color="blue"
            >
              {totalMale}
            </Text>
            
            <Group position="apart">
              <Text size="xs" color="dimmed">Peak Month</Text>
              <Badge color="blue" size="xs">{malePeakMonth}</Badge>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={1}>
          <Card 
            shadow="sm" 
            p="md" 
            radius="md" 
            withBorder 
            style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Group position="apart">
              <Text size="sm" weight={500} color="dimmed">Female Orders</Text>
              <ThemeIcon color="red" variant="light" radius="xl" size="sm">
                <UserX size={14} />
              </ThemeIcon>
            </Group>
            
            <Text 
              size="xl" 
              weight={700}
              color="red"
            >
              {totalFemale}
            </Text>
            
            <Group position="apart">
              <Text size="xs" color="dimmed">Peak Month</Text>
              <Badge color="red" size="xs">{femalePeakMonth}</Badge>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <LineChart
        h={300}
        data={chartData}
        dataKey="month"
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
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
        curveType="linear"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#f1f5f9',
          '--chart-grid-color': '#e2e8f0',
          '--chart-text-color': '#64748b',
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
    </Paper>
  );
}

export default GenderChart;