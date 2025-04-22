import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Paper, 
  Grid, 
  Group, 
  Text, 
  ThemeIcon, 
  Container,
  Box,
  Title
} from '@mantine/core';
import { 
  PackageCheck, 
  Package, 
  Truck
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Filter from './filter';
import Filtrage from './filtrage';

function Header() {
  const [statistics, setStatistics] = useState({
    total_orders: 0,
    total_customers: 0,
    delivered_orders: 0,
    returned_orders: 0
  });
  const reduxOrders = useSelector(state => state.orders);

  const fetchStatistics = async (params = {}) => {
    try {
      const response = await axios.get('http://localhost:8000/api/statistics', { params });
      const fetchedOrders = response.data.orders;
      
      setStatistics({
        total_orders: fetchedOrders.length,
        total_customers: new Set(fetchedOrders.map(order => order.customer_name)).size,
        delivered_orders: fetchedOrders.filter(order => order.status === 'Delivered').length,
        returned_orders: fetchedOrders.filter(order => order.status === 'Return').length
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Re-fetch statistics when reduxOrders change
  useEffect(() => {
    if (reduxOrders && reduxOrders.length > 0) {
      fetchStatistics();
    }
  }, [reduxOrders]);

  const StatisticCard = ({ icon, title, value, color }) => (
    <Paper 
      withBorder 
      radius="md" 
      p="md" 
      sx={(theme) => ({
        backgroundColor: theme.white,
        boxShadow: theme.shadows.xs,
        transition: 'transform 0.2s ease',
        textAlign: 'center', // Center the text
        maxWidth: 200, // Limit the card width
        margin: '0 auto', // Center the card horizontally
        '&:hover': {
          transform: 'translateY(-5px)'
        }
      })}
    >
      <Group position="center" spacing="xs">
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="xs" color="dimmed" transform="uppercase" mt="sm">
        {title}
      </Text>
      <Text weight={700} size="lg" mt="xs">
        {value.toLocaleString()}
      </Text>
    </Paper>
  );

  // Séparer le composant de filtre de son container pour le rendre inline
  const renderImportButton = () => {
    // On n'utilise que le composant Filter sans son wrapper Group
    return <Filter onStatisticsUpdate={fetchStatistics} statistics={statistics} />;
  };

  return (
    <Container size="xl" px="md">
      {/* Dashboard Title */}
      <Title order={2} color="blue" mb="md">
        Orders Dashboard
      </Title>
      
      {/* Action Buttons Side by Side */}
      <Group position="left" spacing="md" mb="md">
        <Filtrage />
        {renderImportButton()}
      </Group>
      
      {/* Statistics Cards */}
      <Grid gutter="md" mb="md" >
        <Grid.Col span={4}>
          <StatisticCard 
            icon={<Package size={20} />}
            title="Total Orders"
            value={statistics.total_orders}
            color="blue"
          />
        </Grid.Col>
        
        <Grid.Col span={4}>
          <StatisticCard 
            icon={<Truck size={20} />}
            title="Delivered Orders"
            value={statistics.delivered_orders}
            color="green"
          />
        </Grid.Col>
        
        <Grid.Col span={4}>
          <StatisticCard 
            icon={<PackageCheck size={20} />}
            title="Returned Orders"
            value={statistics.returned_orders}
            color="red"
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default Header;