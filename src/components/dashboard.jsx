import React from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Text,
  Group,
  ThemeIcon
} from '@mantine/core';
import {
  BarChart2,
  MapPin,
  Package,
  Truck,
  Users
} from 'lucide-react';

import Header from './header';
import MapChart from './mapchart';
import Chart from './chart';
import SKUChart from './skuchart';
import { GenderChart } from './genderchart';
import NoData from './nodata';

// Add normal CSS styles with media query
const styles = `
  .chart-grid {
    display: flex;
    flex-wrap: wrap;
    margin: -8px;
  }
  
  .chart-item {
    width: calc(50% - 16px);
    margin: 8px;
  }
  
  @media (max-width: 989px) {
    .chart-grid {
      display: block;
      margin: 0;
    }
    
    .chart-item {
      width: 100%;
      margin: 0 0 16px 0;
    }
  }
`;

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
      {/* Add style tag with normal CSS */}
      <style>{styles}</style>
      
      <Header />
      <br /><br /> <br />
      {isDataLoaded ? (
        <div className="chart-grid">
          <div className="chart-item">
            <Chart />
          </div>
          
          <div className="chart-item">
            <MapChart />
          </div>
          
          <div className="chart-item">
            <SKUChart />
          </div>
          
          <div className="chart-item">
            <GenderChart />
          </div>
        </div>
      ) : (
        <NoData />
      )}
    </Container>
  );
}

export default Dashboard;