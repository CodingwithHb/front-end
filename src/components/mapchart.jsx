import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { Modal, Paper, Text, Group, Badge, Stack, Title, ActionIcon, Tooltip, Box, Flex } from '@mantine/core';
import { MapPin, Info, TrendingUp, TrendingDown } from 'lucide-react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
const countryMapping = {
  UAE: 'United Arab Emirates',
  KSA: 'Saudi Arabia',
  JOR: 'Jordan',
  OMN: 'Oman',
  YEM: 'Yemen',
  QAT: 'Qatar',
  BHR: 'Bahrain',
  KWT: 'Kuwait',
};

const colorMapping = {
  KSA: '#22c55e',  // Vibrant green
  UAE: '#8b5cf6',  // Vibrant purple
  JOR: '#06b6d4',  // Vibrant cyan
  OMN: '#9333ea',  // Vibrant purple
  YEM: '#78716c',  // Warm gray
  QAT: '#ec4899',  // Vibrant pink
  BHR: '#3b82f6',  // Vibrant blue
  KWT: '#84cc16',  // Vibrant lime
};

// Updated coordinates to center of countries
const countryCoordinates = {
  KSA: [45.0792, 23.8859],
  UAE: [54.3773, 23.4241],
  JOR: [36.2384, 30.5852],
  OMN: [57.0000, 21.0000],
  YEM: [48.0000, 15.5000],
  QAT: [51.1839, 25.3548],
  BHR: [50.7, 25.9304],
  KWT: [47.4818, 29.3117],
};

function MapChart() {
  const orders = useSelector((state) => state.orders);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [opened, setOpened] = useState(false);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

  const ordersByCountry = useMemo(() => {
    const countryOrders = {};
    orders?.forEach((order) => {
      const { customer_country } = order;
      countryOrders[customer_country] = (countryOrders[customer_country] || 0) + 1;
    });
    return countryOrders;
  }, [orders]);

  const countryStats = useMemo(() => {
    const stats = Object.entries(ordersByCountry);
    const maxOrders = Math.max(...stats.map(([, count]) => count));
    const minOrders = Math.min(...stats.map(([, count]) => count));

    return Object.keys(countryMapping).map(code => ({
      code,
      name: countryMapping[code],
      coordinates: countryCoordinates[code],
      orders: ordersByCountry[code] || 0,
      isHighest: ordersByCountry[code] === maxOrders,
      isLowest: ordersByCountry[code] === minOrders && ordersByCountry[code] > 0,
    }));
  }, [ordersByCountry]);

  const handleCountryClick = (countryCode) => {
    setSelectedCountry({ code: countryCode, name: countryMapping[countryCode] });
    setOpened(true);
  };
  

  const getCityTotalsForCountry = (countryCode) => {
    const relevantOrders = orders?.filter(
      (order) => order.customer_country === countryCode
    ) || [];
    
    const cityMap = {};
    relevantOrders.forEach((order) => {
      const city = order.customer_city || 'Unknown';
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    return Object.entries(cityMap);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 }));
  };

  const handleMoveEnd = (position) => {
    setPosition(position);
  };

  return (
    <Paper shadow="sm" radius="md" p="md" className="relative">
      
      <Group justify="space-between" mb="md">
        <Title order={2}>Regional Order Distribution</Title>
       
       <Group  style={{marginTop: 13}}>
  
          <Box mr="md">
            <Group gap="xs">
              <Badge leftSection={<TrendingUp size={14} />} color="green">Highest Orders</Badge>
              <Badge leftSection={<TrendingDown size={14} />} color="red">Lowest Orders</Badge>
            </Group>
          </Box>
          <Tooltip label="Click on countries to see detailed order information">
            <ActionIcon variant="subtle" color="gray">
              <Info size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
<br /><br /> 
      <div className="map-container">
      <ComposableMap
      className="map-svg"
          projection="geoMercator"
          projectionConfig={{ scale: 1200, center: [50, 25] }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name;
                  const code = Object.entries(countryMapping).find(([_, name]) => name === geoName)?.[0];
                  const fillColor = code ? colorMapping[code] : '#e5e7eb';

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', opacity: 0.8 },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => code && handleCountryClick(code)}
                    />
                  );
                })
              }
            </Geographies>

            {countryStats.map(({ code, name, coordinates, orders, isHighest, isLowest }) => (
              <Marker key={code} coordinates={coordinates}>
                <g transform="translate(-12, -24)">
                  <MapPin 
                    size={18} 
                    color={isHighest ? '#22c55e' : isLowest ? '#ef4444' : (orders > 0 ? '#6366f1' : '#9ca3af')}
                    fill={isHighest ? '#dcfce7' : isLowest ? '#fee2e2' : (orders > 0 ? '#e0e7ff' : '#f3f4f6')}
                    strokeWidth={isHighest || isLowest ? 2 : 1}
                    onClick={() => code && handleCountryClick(code)} />
                </g>
                <text
                  textAnchor="middle"
                  y={-28}
                  style={{
                    fontFamily: 'system-ui',
                    fontSize: '12px',
                    fill: '#374151',
                    fontWeight: isHighest || isLowest ? '600' : '500',
                  }}
                >
                  {code}
                 
                </text>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={
            <Title order={3}>
              {selectedCountry ? `Orders in ${selectedCountry.name}` : 'Country Details'}
            </Title>
          }
          size="lg"
    >
    <Flex justify="space-between"    align="center"     gap="md">
        <Text size="sm" c="dimmed">
          total orders : {selectedCountry ? ordersByCountry[selectedCountry.code] || 0 : 0}
        </Text>
        
        <Text size="sm" c="dimmed">
          Detailed breakdown of orders by city
        </Text>
    </Flex>
 <br />
  {selectedCountry ? (
    (() => {
      const cityTotals = getCityTotalsForCountry(selectedCountry.code);
      if (cityTotals.length === 0) {
        return (
          <Text c="dimmed" ta="center" py="xl">
            No orders found for this country.
          </Text>
        );
      }

      const sortedCities = [...cityTotals].sort(([, a], [, b]) => b - a);
      const highestOrders = sortedCities[0][1];
      const lowestOrders = sortedCities[sortedCities.length - 1][1];

      return (
        <Stack gap="xs">
          {sortedCities.map(([cityName, total]) => (
            <Group key={cityName} justify="space-between" p="xs" bg="gray.0" style={{ borderRadius: 8 }}>
              <Group gap="xs">
                <Text fw={500}>{cityName}</Text>
                {total === highestOrders && (
                  <Badge color="green" variant="light" leftSection={<TrendingUp size={14} />}>
                    Highest
                  </Badge>
                )}
                {total === lowestOrders && (
                  <Badge color="red" variant="light" leftSection={<TrendingDown size={14} />}>
                    Lowest
                  </Badge>
                )}
              </Group>
              <Badge
                size="lg"
                variant="light"
                color={total === highestOrders ? 'green' : total === lowestOrders ? 'red' : 'blue'}
              >
                {total} orders
              </Badge>
            </Group>
          ))}
        </Stack>
      );
    })()
  ) : (
    <Text c="dimmed" ta="center" py="xl">
      No country selected.
    </Text>
  )}
</Modal>
    </Paper>
  );
}

export default MapChart;