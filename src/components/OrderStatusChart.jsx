import React, { useMemo } from 'react';
import { BarChart } from '@mantine/charts';
import { Paper, Title, Text } from '@mantine/core';
import { useSelector } from 'react-redux';

function OrderStatusChart({ statistics }) {
  const { orders } = useSelector((state) => state);

  // Prepare data for the BarChart
  const chartData = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return [];
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Initialize each month’s counters
    const monthsData = months.map((month) => ({
      month,
      Delivered: 0,
      Return: 0,
    }));

    orders.forEach((order) => {
      // If a date filter is applied, skip orders outside the range
      if (statistics && statistics.start_date && statistics.end_date) {
        const orderDate = new Date(order.date);
        const startDate = new Date(statistics.start_date);
        const endDate = new Date(statistics.end_date);
        if (orderDate < startDate || orderDate > endDate) {
          return;
        }
      }

      // Safely parse the month from order.date
      if (!order.date) return;
      const dateObj = new Date(order.date);
      if (isNaN(dateObj)) return; // skip invalid date
      const monthIndex = dateObj.getMonth(); // 0..11

      // Tally only Delivered or Return
      if (order.status === 'Delivered') {
        monthsData[monthIndex].Delivered += 1;
      } else if (order.status === 'Return') {
        monthsData[monthIndex].Return += 1;
      }
    });

    return monthsData;
  }, [orders, statistics]);

  // Dynamically figure out the max number of orders for the Y-axis domain
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 10;
    return Math.max(
      ...chartData.map((m) => Math.max(m.Delivered, m.Return))
    );
  }, [chartData]);

  return (
    <Paper p="md" radius="md" shadow="sm" className="w-full mt-2">
      <Title order={3} mb="md">
        Analyse by status
      </Title>

      {chartData.length > 0 ? (
        <BarChart
          // Height of the chart area
          h={300}
          data={chartData}
          // Which property is used for the X-axis category
          dataKey="month"
          // Series definitions (keys + colors)
          series={[
            { name: 'Delivered', color: '#0ea5e9' },
            { name: 'Return', color: '#10b981' },
          ]}
          // Add some space between bars
          groupPadding={0.2}
          // Turn on a y-axis grid, etc.
          gridAxis="y"
          tickLine="y"
          // Add a legend at the bottom
          withLegend
          legendProps={{ verticalAlign: 'bottom', height: 40 }}
          // Turn on helpful cursor + tooltips
          withCursor
          withTooltip
          // Dynamically scale up to a bit more than max
          yAxisProps={{ domain: [0, maxValue + 2] }}
          style={{
            overflow: 'visible',
            '--chart-cursor-fill': '#e5e1e1', // Custom CSS variable for cursor fill
            '--chart-grid-color': 'gray',     // Custom CSS variable for grid color
            '--chart-text-color': 'gray'      // Custom CSS variable for text color
          }}
        />
      ) : (
        <Text ta="center" c="dimmed" py="xl">
          No order data available
        </Text>
      )}
    </Paper>
  );
}

export default OrderStatusChart;
