import React from 'react';
import { 
  useSelector 
} from 'react-redux';
import { 
  Container, 
  Grid, 
  Paper, 
  Text, 
  Group, 
  ThemeIcon 
} from '@mantine/core';
import { 
  BarChart2, 
  MapPin, 
  Package, 
  Users 
} from 'lucide-react';

import Header from './header';
import MapChart from './mapchart';
import Chart from './chart';
import SKUChart from './skuchart';
import { GenderChart } from './genderchart';
import NoData from './nodata';

function Dashboard() {
  const orders = useSelector((state) => state.orders);
  const isDataLoaded = orders && orders.length > 0;

  const ChartCard = ({ title, icon, children }) => (
    <Paper 
      withBorder 
      radius="md" 
      p="md" 
      sx={(theme) => ({
        backgroundColor: theme.white,
        boxShadow: theme.shadows.xs,
        transition: 'transform 0.2s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-5px)'
        }
      })}
    >
      <Group position="apart" mb="md">
        <Group>
          <ThemeIcon variant="light" color="blue" radius="md">
            {icon}
          </ThemeIcon>
          <Text weight={600}>{title}</Text>
        </Group>
      </Group>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </Paper>
  );

  return (
    <Container size="xl" px="md">
      <Header />

      {isDataLoaded ? (
        <Grid gutter="md">
          <Grid.Col span={6}>
            <ChartCard 
              title="Order Status Analysis" 
              icon={<BarChart2 size={20} />}
            >
              <Chart />
            </ChartCard>
          </Grid.Col>

          <Grid.Col span={6}>
            <ChartCard 
              title="Regional Order Distribution" 
              icon={<MapPin size={20} />}
            >
              <MapChart />
            </ChartCard>
          </Grid.Col>

          <Grid.Col span={6}>
            <ChartCard 
              title="SKU Performance" 
              icon={<Package size={20} />}
            >
              <SKUChart />
            </ChartCard>
          </Grid.Col>

          <Grid.Col span={6}>
            <ChartCard 
              title="Gender Analysis" 
              icon={<Users size={20} />}
            >
              <GenderChart />
            </ChartCard>
          </Grid.Col>
        </Grid>
      ) : (
        <NoData />
      )}
    </Container>
  );
}

export default Dashboard;