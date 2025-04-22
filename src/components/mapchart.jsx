import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import {
  Modal,
  Paper,
  Text,
  Group,
  Badge,
  Stack,
  Title,
  ActionIcon,
  Tooltip,
  Divider,
  Accordion,
  Box,
  Progress,
  Grid,
  Card,
  SimpleGrid,
  RingProgress,
  ThemeIcon,
  Timeline
} from '@mantine/core';
import { MapPin, Info, TrendingUp, MapIcon, Calendar, Award, BoxIcon, ArrowUp, ChevronRight, Building2, Clock, Star, TrendingUp as TrendIcon, BarChart2 } from 'lucide-react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import '../styles/mapchart.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
const countryMapping = { UAE: 'United Arab Emirates', KSA: 'Saudi Arabia', JOR: 'Jordan', OMN: 'Oman', YEM: 'Yemen', QAT: 'Qatar', BHR: 'Bahrain', KWT: 'Kuwait' };
const colorMapping = { KSA: '#22c55e', UAE: '#8b5cf6', JOR: '#06b6d4', OMN: '#9333ea', YEM: '#78716c', QAT: '#ec4899', BHR: '#3b82f6', KWT: '#84cc16' };
const countryCoordinates = { KSA: [45.0792, 23.8859], UAE: [54.3773, 23.4241], JOR: [36.2384, 30.5852], OMN: [57.0, 21.0], YEM: [48.0, 15.5], QAT: [51.1839, 25.3548], BHR: [50.7, 25.9304], KWT: [47.4818, 29.3117] };
const cityEmojis = ['🏙️', '🌆', '🌃', '🏢', '🌇', '🌁'];
const monthColors = {
  Jan: '#3b82f6', Feb: '#8b5cf6', Mar: '#ec4899', Apr: '#f97316', 
  May: '#22c55e', Jun: '#06b6d4', Jul: '#84cc16', Aug: '#eab308',
  Sep: '#ef4444', Oct: '#6366f1', Nov: '#14b8a6', Dec: '#f43f5e'
};

export default function MapChart() {
  const orders = useSelector((state) => state.orders);
  const filterSku = useSelector((state) => state.filterSku);
  const filterGender = useSelector((state) => state.filterGender);
  const filterStatus = useSelector((state) => state.filterStatus);
  const filterStart = useSelector((state) => state.filterStartDate);
  const filterEnd = useSelector((state) => state.filterEndDate);

  const startDate = dayjs(filterStart);
  const endDate = dayjs(filterEnd);
  const filtered = orders
    .filter(o => {
      const d = o.delivered_date || o.return_date || o.shipped_at;
      return d && dayjs(d).isBetween(startDate, endDate, null, '[]');
    })
    .filter(o =>
      (filterSku === 'All' || o.sku === filterSku) &&
      (filterStatus === 'All' || o.status === filterStatus) &&
      (filterGender === 'All' || o.gender?.toLowerCase() === filterGender.toLowerCase())
    );

  // Totals per country
  const countryTotals = {};
  filtered.forEach(o => {
    const c = o.customer_country;
    if (c) countryTotals[c] = (countryTotals[c] || 0) + 1;
  });
  const entries = Object.entries(countryTotals);
  const maxTotal = entries.length ? Math.max(...entries.map(([, v]) => v)) : 0;
  const minTotal = entries.length ? Math.min(...entries.map(([, v]) => v)) : 0;
  const stats = Object.keys(countryMapping).map(code => ({
    code,
    name: countryMapping[code],
    coords: countryCoordinates[code],
    total: countryTotals[code] || 0,
    isMax: countryTotals[code] === maxTotal && maxTotal > 0,
    isMin: countryTotals[code] === minTotal && minTotal > 0,
  }));

  // Map and modal state
  const [pos, setPos] = useState({ coordinates: [50, 25], zoom: 1 });
  const [selCountry, setSelCountry] = useState(null);
  const [opened, setOpened] = useState(false);
  const openCountry = (code) => { setSelCountry(code); setOpened(true); };

  // City helpers
  const getCities = code => Array.from(new Set(filtered.filter(o => o.customer_country === code).map(o => o.customer_city || 'Unknown')));
  const getYearMonthByCity = (code, city) => {
    const data = filtered.filter(o => o.customer_country === code && (o.customer_city || 'Unknown') === city);
    const map = {};
    data.forEach(o => {
      const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
      const ym = `${d.format('YYYY')}/${d.format('MMM')}`;
      map[ym] = (map[ym] || 0) + 1;
    });
    return Object.entries(map).sort();
  };

  // Totals per city
  const cityTotalsMap = {};
  const cityPeakMonthMap = {};
  if (selCountry) {
    getCities(selCountry).forEach(city => {
      cityTotalsMap[city] = filtered.filter(o => o.customer_country === selCountry && (o.customer_city || 'Unknown') === city).length;
      
      // Find peak month for each city
      const yearMonthData = getYearMonthByCity(selCountry, city);
      if (yearMonthData.length) {
        const maxEntry = yearMonthData.reduce((max, current) => 
          current[1] > max[1] ? current : max, yearMonthData[0]);
        const [year, month] = maxEntry[0].split('/');
        cityPeakMonthMap[city] = { 
          year, 
          month, 
          count: maxEntry[1],
          formatted: `${month} ${year}` 
        };
      }
    });
  }
  
  const maxCityTotal = selCountry ? Math.max(...Object.values(cityTotalsMap)) : 0;
  const totalCountryOrders = selCountry ? (countryTotals[selCountry] || 0) : 0;

  const allCities = selCountry ? getCities(selCountry) : [];
  const topCities = selCountry ? allCities.filter(city => cityTotalsMap[city] === maxCityTotal) : [];
  const otherCities = selCountry ? allCities.filter(city => cityTotalsMap[city] !== maxCityTotal).sort((a, b) => cityTotalsMap[b] - cityTotalsMap[a]) : [];
  
  // Get performance trends
  const getCountryTrend = (code) => {
    if (!code) return { trend: 0, months: [] };
    const data = filtered.filter(o => o.customer_country === code);
    const monthlyData = {};
    
    data.forEach(o => {
      const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
      const month = d.format('YYYY-MM');
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const trend = sortedMonths.length >= 2 ? 
      ((monthlyData[sortedMonths[sortedMonths.length - 1]] || 0) - 
       (monthlyData[sortedMonths[0]] || 0)) / (monthlyData[sortedMonths[0]] || 1) * 100 : 0;
    
    return { trend, months: sortedMonths.map(m => ({ month: m, count: monthlyData[m] })) };
  };
  
  const countryTrend = getCountryTrend(selCountry);
  
  // Country monthly peak data
  const getCountryPeakMonth = (code) => {
    if (!code) return null;
    
    const monthlyData = {};
    filtered.filter(o => o.customer_country === code).forEach(o => {
      const d = dayjs(o.delivered_date || o.return_date || o.shipped_at);
      const monthKey = d.format('MMM');
      const yearMonth = d.format('YYYY-MMM');
      monthlyData[yearMonth] = (monthlyData[yearMonth] || 0) + 1;
    });
    
    if (Object.keys(monthlyData).length === 0) return null;
    
    const maxEntry = Object.entries(monthlyData).reduce(
      (max, [yearMonth, count]) => count > max.count ? { yearMonth, count } : max, 
      { yearMonth: Object.keys(monthlyData)[0], count: monthlyData[Object.keys(monthlyData)[0]] }
    );
    
    const [year, month] = maxEntry.yearMonth.split('-');
    
    return {
      year,
      month,
      count: maxEntry.count,
      formatted: `${month} ${year}`
    };
  };
  
  const countryPeakMonth = getCountryPeakMonth(selCountry);

  return (
    <Paper p="md" shadow="sm">
      <Group position="apart" mb="md">
        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
          <BarChart2 size={18} />
        </ThemeIcon>
        <Title order={3}>Regional Orders</Title>
        <Tooltip label="Click pins for details"><ActionIcon><Info size={18}/></ActionIcon></Tooltip>
      </Group>
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 900, center: [50, 25] }}
        style={{
          minHeight: '300px',
          maxHeight: '433px',
          height: '700px',
          width: '100%'
        }}
      >
        <ZoomableGroup zoom={pos.zoom} center={pos.coordinates} onMoveEnd={setPos}>
          <Geographies geography={geoUrl}>{({ geographies }) => geographies.map(g => {
            const code = Object.entries(countryMapping).find(([, n]) => n === g.properties.name)?.[0];
            return <Geography key={g.rsmKey} geography={g} fill={code?colorMapping[code]:'#e5e7eb'} stroke="white" strokeWidth={0.5} onClick={()=>code&&openCountry(code)}/>;
          })}</Geographies>
          {stats.map(s => (
            <Marker key={s.code} coordinates={s.coords} onClick={()=>openCountry(s.code)}>
              <MapPin size={18} color={s.isMax?'#22c55e':s.isMin?'#ef4444':'#6366f1'}/>
              <text textAnchor="middle" y={-30} fontSize={12}>{s.code}</text>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      <Modal opened={opened} onClose={()=>setOpened(false)} size="xl" title={
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color={selCountry ? colorMapping[selCountry].replace('#', '') : 'blue'}>
            <MapIcon size={18} />
          </ThemeIcon>
          <Title order={4}>{selCountry ? countryMapping[selCountry] : 'Details'}</Title>
        </Group>
      }>
        {selCountry && (
          <>
            <Grid gutter="md" mb="md">
              <Grid.Col span={4}>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Group position="apart">
                    <Text size="lg" weight={500} color="dimmed">Total Orders</Text>
                    <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
                      <BoxIcon size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" weight={700} mt="sm">{totalCountryOrders}</Text>
                  <Box mt="sm">
                    <Group position="apart" spacing="xs">
                      <Text size="sm" color={countryTrend.trend >= 0 ? "green" : "red"}>
                        {countryTrend.trend.toFixed(1)}%
                      </Text>
                      <Text size="xs" color="dimmed">vs first month</Text>
                    </Group>
                  </Box>
                </Card>
              </Grid.Col>
              <Grid.Col span={4}>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Group position="apart">
                    <Text size="lg" weight={500} color="dimmed">Peak Month</Text>
                    <ThemeIcon color="orange" variant="light" radius="xl" size="lg">
                      <Calendar size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" weight={700} mt="sm">
                    {countryPeakMonth ? countryPeakMonth.formatted : "N/A"}
                  </Text>
                  <Box mt="sm">
                    <Text size="sm" color="dimmed">
                      {countryPeakMonth ? `${countryPeakMonth.count} orders` : "No data"}
                    </Text>
                  </Box>
                </Card>
              </Grid.Col>
              <Grid.Col span={4}>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Group position="apart">
                    <Text size="lg" weight={500} color="dimmed">Top City</Text>
                    <ThemeIcon color="pink" variant="light" radius="xl" size="lg">
                      <Award size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" weight={700} mt="sm">{topCities[0] || "N/A"}</Text>
                  <Box mt="sm">
                    <Text size="sm" color="dimmed">
                      {maxCityTotal} orders - {totalCountryOrders ? ((maxCityTotal / totalCountryOrders) * 100).toFixed(1) : 0}%
                    </Text>
                  </Box>
                </Card>
              </Grid.Col>
            </Grid>

            <Divider my="lg" label={<Text weight={500}>City Monthly Performance</Text>} labelPosition="center" />
            
            <Box mb="lg">
              <Title order={5} mb="md">Top Cities Monthly Breakdown</Title>
              <Grid gutter="md">
                {topCities.map((city, idx) => {
                  const peakMonth = cityPeakMonthMap[city];
                  return (
                    <Grid.Col key={city} span={6}>
                      <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group position="apart" mb="md">
                          <Group>
                            <ThemeIcon size="lg" radius="xl" color="green">
                              <Star size={18} />
                            </ThemeIcon>
                            <Text size="lg" weight={500}>{city}</Text>
                          </Group>
                          <Badge color="green" size="lg">{cityTotalsMap[city]} orders</Badge>
                        </Group>
                        
                        <Box mb="lg">
                          <Text weight={500} size="sm" mb="xs">Performance</Text>
                          <Progress 
                            value={100} 
                            color={colorMapping[selCountry]} 
                            size="lg" 
                            radius="sm"
                            label={`${((cityTotalsMap[city] / totalCountryOrders) * 100).toFixed(1)}%`}
                            styles={{ label: { color: 'white', fontWeight: 700 } }}
                          />
                        </Box>
                        
                        <Group position="apart" mb="xs">
                          <Text weight={500} size="sm">Peak Month</Text>
                          <Badge 
                            color={peakMonth ? peakMonth.month.toLowerCase() : "gray"} 
                            variant="filled"
                            size="lg"
                          >
                            {peakMonth ? peakMonth.formatted : "N/A"}
                          </Badge>
                        </Group>
                        
                        <Group position="apart">
                          <Text size="sm" color="dimmed">Orders in peak month</Text>
                          <Text weight={700} color={colorMapping[selCountry].replace('#', '')}>
                            {peakMonth ? peakMonth.count : "0"}
                          </Text>
                        </Group>
                      </Card>
                    </Grid.Col>
                  );
                })}
              </Grid>
            </Box>

            <Box mb="lg">
              <Title order={5} mb="md">Other Cities Monthly Performance</Title>
              <SimpleGrid cols={2} spacing="lg">
                {otherCities.slice(0, 6).map((city, idx) => {
                  const peakMonth = cityPeakMonthMap[city];
                  return (
                    <Card key={city} shadow="sm" p="md" radius="md" withBorder>
                      <Group position="apart" mb="md">
                        <Group>
                          <Text size="md" weight={500}>{city}</Text>
                        </Group>
                        <Badge color="blue">{cityTotalsMap[city]} orders</Badge>
                      </Group>
                      
                      <Progress 
                        value={(cityTotalsMap[city] / maxCityTotal) * 100} 
                        color={colorMapping[selCountry]} 
                        size="md" 
                        radius="sm"
                        mb="md"
                      />
                      
                      <Grid>
                        <Grid.Col span={6}>
                          <Group position="apart">
                            <Text size="xs" color="dimmed">City Share</Text>
                            <Text size="xs" weight={500}>
                              {((cityTotalsMap[city] / totalCountryOrders) * 100).toFixed(1)}%
                            </Text>
                          </Group>
                        </Grid.Col>
                        
                        <Grid.Col span={6}>
                          <Group position="apart">
                            <Text size="xs" color="dimmed">Peak Month</Text>
                            <Badge 
                              size="xs" 
                              color={peakMonth ? peakMonth.month.toLowerCase() : "gray"}
                            >
                              {peakMonth ? peakMonth.formatted : "N/A"}
                            </Badge>
                          </Group>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Box>

            {otherCities.length > 6 && (
              <Box>
                <Divider my="md" label={<Text weight={500}>Detailed Monthly Analysis</Text>} labelPosition="center" />
                
                <Accordion variant="separated" radius="md">
                  {otherCities.slice(6).map((city, idx) => {
                    const yearMonthData = getYearMonthByCity(selCountry, city);
                    const maxYearMonth = yearMonthData.length ? Math.max(...yearMonthData.map(([,c])=>c)) : 0;
                    const peakMonth = cityPeakMonthMap[city];
                    
                    return (
                      <Accordion.Item value={city} key={city}>
                        <Accordion.Control>
                          <Group position="apart">
                            <Group>
                              <ThemeIcon 
                                size="sm" 
                                variant="light" 
                                radius="xl" 
                                color={colorMapping[selCountry].replace('#', '')}
                              >
                                {cityEmojis[idx % cityEmojis.length]}
                              </ThemeIcon>
                              <Text>{city}</Text>
                            </Group>
                            <Group spacing="xs">
                              <Badge>{cityTotalsMap[city]} orders</Badge>
                              {peakMonth && (
                                <Badge color={peakMonth.month.toLowerCase()} variant="dot">
                                  {peakMonth.formatted}
                                </Badge>
                              )}
                            </Group>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Grid gutter="md">
                            {yearMonthData.map(([ym, count]) => {
                              const [year, month] = ym.split('/');
                              const isPeak = peakMonth && peakMonth.month === month && peakMonth.year === year;
                              
                              return (
                                <Grid.Col span={6} key={ym}>
                                  <Card p="sm" radius="md" withBorder style={isPeak ? { borderColor: monthColors[month], borderWidth: 2 } : {}}>
                                    <Group position="apart">
                                      <Group>
                                        <ThemeIcon 
                                          size="sm" 
                                          variant={isPeak ? "filled" : "light"} 
                                          radius="xl" 
                                          color={isPeak ? month.toLowerCase() : "gray"}
                                        >
                                          {isPeak ? <Star size={12} /> : <Calendar size={12} />}
                                        </ThemeIcon>
                                        <Text>{month} {year}</Text>
                                      </Group>
                                      <Badge color={isPeak ? month.toLowerCase() : "gray"}>
                                        {count}
                                      </Badge>
                                    </Group>
                                    <Progress 
                                      value={(count / maxYearMonth) * 100} 
                                      color={isPeak ? monthColors[month] : "gray"} 
                                      size="xs" 
                                      radius="sm"
                                      mt="md"
                                    />
                                    {isPeak && (
                                      <Text size="xs" align="right" mt="xs" color="dimmed">
                                        Top month for this city
                                      </Text>
                                    )}
                                  </Card>
                                </Grid.Col>
                              );
                            })}
                          </Grid>
                        </Accordion.Panel>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              </Box>
            )}
          </>
        )}
      </Modal>
    </Paper>
  );
}