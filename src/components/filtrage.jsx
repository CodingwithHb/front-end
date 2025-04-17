import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Paper,
  Accordion,
  Select,
  Group,
  Box,
  Text,
  Title,
  Divider
} from '@mantine/core';
import {
  IconFilter,
  IconCalendar,
  IconPackage,
  IconUsers,
  IconTruckDelivery
} from '@tabler/icons-react';
import dayjs from 'dayjs';

import { setFilters, setDateFilter } from '../redux/actions';

// Génère un tableau de nombres (ex. 1..31 ou années 2022..2030)
function generateRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// Mois sous forme { value: "0", label: "Jan" }, etc.
const months = [
  { value: '0', label: 'Jan' },
  { value: '1', label: 'Feb' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Apr' },
  { value: '4', label: 'May' },
  { value: '5', label: 'Jun' },
  { value: '6', label: 'Jul' },
  { value: '7', label: 'Aug' },
  { value: '8', label: 'Sep' },
  { value: '9', label: 'Oct' },
  { value: '10', label: 'Nov' },
  { value: '11', label: 'Dec' },
];

export default function Filtrage() {
  const dispatch = useDispatch();

  // Lecture du state Redux
  const {
    filterSku,
    filterGender,
    filterStatus,
    filterStartDate,
    filterEndDate,
    orders
  } = useSelector((state) => state);

  // Dates
  const start = dayjs(filterStartDate);
  const end = dayjs(filterEndDate);
  const startDay = start.date();
  const startMonth = start.month();
  const startYear = start.year();
  const endDay = end.date();
  const endMonth = end.month();
  const endYear = end.year();

  // Liste unique des SKUs
  const uniqueSkus = [...new Set(orders.map((o) => o.sku))].filter(Boolean);

  // Handlers pour les Select
  const handleSkuChange = (value) =>
    dispatch(setFilters(value, filterGender, filterStatus));

  const handleGenderChange = (value) =>
    dispatch(setFilters(filterSku, value, filterStatus));

  const handleStatusChange = (value) =>
    dispatch(setFilters(filterSku, filterGender, value));

  // Mise à jour des dates
  const handleDateChange = (type, field, newValue) => {
    const current = dayjs(type === 'start' ? filterStartDate : filterEndDate);
    const updated = current.set(field, Number(newValue));

    if (type === 'start') {
      dispatch(setDateFilter(updated.format('YYYY-MM-DD'), filterEndDate));
    } else {
      dispatch(setDateFilter(filterStartDate, updated.format('YYYY-MM-DD')));
    }
  };

  // Options pour les Select
  const skuData = [
    { value: 'All', label: 'All SKUs' },
    ...uniqueSkus.map((sku) => ({ value: sku, label: sku })),
  ];

  const genderData = [
    { value: 'All', label: 'All Genders' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
  ];

  const statusData = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Return', label: 'Return' },
  ];

  const dayOptions = generateRange(1, 31).map((d) => ({
    value: String(d),
    label: String(d),
  }));
  const yearOptions = generateRange(2022, 2030).map((y) => ({
    value: String(y),
    label: String(y),
  }));

  // Styles “compacts” pour Mantine Select
  const selectStyles = {
    input: {
      height: 28,
      fontSize: 12,
      minHeight: 'auto',
    },
    rightSection: {
      pointerEvents: 'none',
      width: 20,
    },
  };

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      shadow="md"
      style={{
        width: '350px',      // Fix the width to something small
        margin: '20px auto'  // Center horizontally
      }}
      sx={(theme) => ({
        maxWidth: 300, 
        margin: '20px auto',
        // Light background gradient for some extra flair:
        backgroundImage: theme.fn.gradient({
          from: theme.colors.gray[0],
          to: theme.colors.gray[2],
          deg: 135,
        }),
      })}
    >
      <Group spacing="xs" mb="md">
        <IconFilter size={18} />
        <Title order={4} style={{ margin: 0 }}>
          Filter Orders
        </Title>
      </Group>

      <Divider mb="sm" />

      {/* Accordion for collapsible sections */}
      <Accordion variant="separated" multiple>
        {/* Product Filters */}
        <Accordion.Item value="products">
          <Accordion.Control icon={<IconPackage size={14} />}>
            Product Filters
          </Accordion.Control>
          <Accordion.Panel>
            <Group spacing="md" mt="xs" noWrap>
              {/* SKU */}
              <Box>
                <Text size="xs" weight={600} mb={4}>
                  SKU
                </Text>
                <Select
                  data={skuData}
                  value={filterSku}
                  onChange={handleSkuChange}
                  placeholder="SKU"
                  size="xs"
                  styles={selectStyles}
                  sx={{ width: 120 }}
                />
              </Box>

              {/* Status */}
              <Box>
                <Text size="xs" weight={600} mb={4}>
                  Status
                </Text>
                <Select
                  data={statusData}
                  value={filterStatus}
                  onChange={handleStatusChange}
                  placeholder="Status"
                  size="xs"
                  styles={selectStyles}
                  sx={{ width: 120 }}
                />
              </Box>

              {/* Gender */}
              <Box>
                <Text size="xs" weight={600} mb={4}>
                  Gender
                </Text>
                <Select
                  data={genderData}
                  value={filterGender}
                  onChange={handleGenderChange}
                  placeholder="Gender"
                  size="xs"
                  styles={selectStyles}
                  sx={{ width: 120 }}
                />
              </Box>
            </Group>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Date Filters */}
        <Accordion.Item value="dates">
          <Accordion.Control icon={<IconCalendar size={14} />}>
            Date Range
          </Accordion.Control>
          <Accordion.Panel>

            {/* 
              Two columns side by side:
                - LEFT column: "From" label + (Day/Month/Year)
                - RIGHT column: "To" label + (Day/Month/Year)
            */}
            <Group position="apart" align="flex-start" noWrap mt="xs">

              {/* "From" column */}
              <Box>
                <Text size="xs" weight={600} mb={4}>
                  From
                </Text>
                <Group spacing={4} noWrap>
                  {/* FROM: Day */}
                  <Select
                    data={dayOptions}
                    value={String(startDay)}
                    onChange={(val) => handleDateChange('start', 'date', val)}
                    placeholder="D"
                    size="xs"
                    styles={{
                      input: {
                        height: 24,
                        fontSize: 10,
                        padding: '0 4px'
                      },
                      rightSection: {
                        width: 14,
                        pointerEvents: 'none'
                      }
                    }}
                    sx={{ width: 40 }}
                  />
                  {/* FROM: Month */}
                  <Select
                    data={months}
                    value={String(startMonth)}
                    onChange={(val) => handleDateChange('start', 'month', val)}
                    placeholder="M"
                    size="xs"
                    styles={{
                      input: {
                        height: 24,
                        fontSize: 10,
                        padding: '0 4px'
                      },
                      rightSection: {
                        width: 14,
                        pointerEvents: 'none'
                      }
                    }}
                    sx={{ width: 60 }}
                  />
                  {/* FROM: Year */}
                  <Select
                    data={yearOptions}
                    value={String(startYear)}
                    onChange={(val) => handleDateChange('start', 'year', val)}
                    placeholder="Y"
                    size="xs"
                    styles={{
                      input: {
                        height: 24,
                        fontSize: 10,
                        padding: '0 4px'
                      },
                      rightSection: {
                        width: 14,
                        pointerEvents: 'none'
                      }
                    }}
                    sx={{ width: 60 }}
                  />
                </Group>
              </Box>

              {/* "To" column */}
              <Box>
                <Text size="xs" weight={600} mb={4}>
                  To
                </Text>
                <Group spacing={4} noWrap>
                  {/* TO: Day */}
                  <Select
                    data={dayOptions}
                    value={String(endDay)}
                    onChange={(val) => handleDateChange('end', 'date', val)}
                    placeholder="D"
                    size="xs"
                    styles={{
                      input: {
                        height: 24,
                        fontSize: 10,
                        padding: '0 4px'
                      },
                      rightSection: {
                        width: 14,
                        pointerEvents: 'none'
                      }
                    }}
                    sx={{ width: 40 }}
                  />
                  {/* TO: Month */}
                  <Select
                    data={months}
                    value={String(endMonth)}
                    onChange={(val) => handleDateChange('end', 'month', val)}
                    placeholder="M"
                    size="xs"
                    styles={{
                      input: {
                        height: 24,
                        fontSize: 10,
                        padding: '0 4px'
                      },
                      rightSection: {
                        width: 14,
                        pointerEvents: 'none'
                      }
                    }}
                    sx={{ width: 60 }}
                  />
                  {/* TO: Year */}
                  <Select
                    data={yearOptions}
                    value={String(endYear)}
                    onChange={(val) => handleDateChange('end', 'year', val)}
                    placeholder="Y"
                    size="xs"
                    styles={{
                      input: {
                        height: 24,
                        fontSize: 10,
                        padding: '0 4px'
                      },
                      rightSection: {
                        width: 14,
                        pointerEvents: 'none'
                      }
                    }}
                    sx={{ width: 60 }}
                  />
                </Group>
              </Box>

            </Group>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
