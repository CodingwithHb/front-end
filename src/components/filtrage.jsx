import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Paper,
  Accordion,
  Select,
  Group,
  Box,
  Text,
  Title,
  Divider,
  Button,
  Modal,
  ActionIcon,
  Badge,
  Tooltip
} from '@mantine/core';
import {
  IconFilter,
  IconCalendar,
  IconPackage,
  IconUsers,
  IconTruckDelivery,
  IconX,
  IconAdjustments
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
  const [opened, setOpened] = useState(false);

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

  // Styles "compacts" pour Mantine Select
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

  // Nombre de filtres actifs
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterSku !== 'All') count++;
    if (filterGender !== 'All') count++;
    if (filterStatus !== 'All') count++;
    return count;
  };

  // Affichage du résumé des filtres
  const getFilterSummary = () => {
    const parts = [];
    if (filterSku !== 'All') parts.push(`SKU: ${filterSku}`);
    if (filterGender !== 'All') parts.push(`Gender: ${filterGender}`);
    if (filterStatus !== 'All') parts.push(`Status: ${filterStatus}`);
    
    return parts.length ? parts.join(' | ') : 'All Orders';
  };

  const getDateRangeSummary = () => {
    return `${start.format('DD MMM YYYY')} - ${end.format('DD MMM YYYY')}`;
  };

  return (
    <>
      <Group position="center" spacing="xs">
        <Tooltip label="Filter Orders">
        <Button
        onClick={() => setOpened(true)}
        leftIcon={<IconFilter  />}
        variant="light"
        color="blue"
        size="sm"
      >
        <Group spacing="xs">
          <Text style={{fontWeight:"bold"}}>Filters</Text>
          <IconFilter size={16} />
        </Group>
        {getActiveFiltersCount() > 0 && (
          <Badge
            color="blue"
            variant="filled"
            size="xs"
            sx={{ marginLeft: 5 }}
          >
            {getActiveFiltersCount()}
          </Badge>
        )}
      </Button>
        </Tooltip>
      </Group>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <IconFilter size={20} />
            <Title order={4}>Filter Orders</Title>
          </Group>
        }
        styles={{
          title: { marginBottom: 0 },
          modal: { maxWidth: 400 }
        }}
      >
        <Box mb="md">
          <Group position="apart">
            <Text size="sm" color="dimmed">Active Filters</Text>
            <Text size="sm" weight={500}>{getFilterSummary()}</Text>
          </Group>
          <Group position="apart" mt={5}>
            <Text size="sm" color="dimmed">Date Range</Text>
            <Text size="sm" weight={500}>{getDateRangeSummary()}</Text>
          </Group>
        </Box>

        <Divider mb="md" />

        {/* Accordion for collapsible sections */}
        <Accordion variant="separated" defaultValue={["products", "dates"]} multiple>
          {/* Product Filters */}
          <Accordion.Item value="products">
            <Accordion.Control icon={<IconPackage size={14} />}>
              Product Filters
            </Accordion.Control>
            <Accordion.Panel>
              <Box mb="md">
                <Text size="xs" weight={600} mb={4}>
                  SKU
                </Text>
                <Select
                  data={skuData}
                  value={filterSku}
                  onChange={handleSkuChange}
                  placeholder="Select SKU"
                  size="xs"
                  styles={selectStyles}
                  sx={{ width: '100%' }}
                />
              </Box>

              <Box mb="md">
                <Text size="xs" weight={600} mb={4}>
                  Status
                </Text>
                <Select
                  data={statusData}
                  value={filterStatus}
                  onChange={handleStatusChange}
                  placeholder="Select Status"
                  size="xs"
                  styles={selectStyles}
                  sx={{ width: '100%' }}
                />
              </Box>

              <Box>
                <Text size="xs" weight={600} mb={4}>
                  Gender
                </Text>
                <Select
                  data={genderData}
                  value={filterGender}
                  onChange={handleGenderChange}
                  placeholder="Select Gender"
                  size="xs"
                  styles={selectStyles}
                  sx={{ width: '100%' }}
                />
              </Box>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Date Filters */}
          <Accordion.Item value="dates">
            <Accordion.Control icon={<IconCalendar size={14} />}>
              Date Range
            </Accordion.Control>
            <Accordion.Panel>
              {/* FROM */}
              <Box mb="md">
                <Text size="xs" weight={600} mb={4}>
                  From
                </Text>
                <Group spacing={8} grow>
                  {/* FROM: Day */}
                  <Box>
                    <Text size="xs" color="dimmed" mb={2}>Day</Text>
                    <Select
                      data={dayOptions}
                      value={String(startDay)}
                      onChange={(val) => handleDateChange('start', 'date', val)}
                      placeholder="D"
                      size="xs"
                      styles={{
                        input: {
                          height: 28,
                          fontSize: 12
                        },
                        rightSection: {
                          width: 20,
                          pointerEvents: 'none'
                        }
                      }}
                    />
                  </Box>
                  {/* FROM: Month */}
                  <Box>
                    <Text size="xs" color="dimmed" mb={2}>Month</Text>
                    <Select
                      data={months}
                      value={String(startMonth)}
                      onChange={(val) => handleDateChange('start', 'month', val)}
                      placeholder="M"
                      size="xs"
                      styles={{
                        input: {
                          height: 28,
                          fontSize: 12
                        },
                        rightSection: {
                          width: 20,
                          pointerEvents: 'none'
                        }
                      }}
                    />
                  </Box>
                  {/* FROM: Year */}
                  <Box>
                    <Text size="xs" color="dimmed" mb={2}>Year</Text>
                    <Select
                      data={yearOptions}
                      value={String(startYear)}
                      onChange={(val) => handleDateChange('start', 'year', val)}
                      placeholder="Y"
                      size="xs"
                      styles={{
                        input: {
                          height: 28,
                          fontSize: 12
                        },
                        rightSection: {
                          width: 20,
                          pointerEvents: 'none'
                        }
                      }}
                    />
                  </Box>
                </Group>
              </Box>

              {/* TO */}
              <Box>
                <Text size="xs" weight={600} mb={4}>
                  To
                </Text>
                <Group spacing={8} grow>
                  {/* TO: Day */}
                  <Box>
                    <Text size="xs" color="dimmed" mb={2}>Day</Text>
                    <Select
                      data={dayOptions}
                      value={String(endDay)}
                      onChange={(val) => handleDateChange('end', 'date', val)}
                      placeholder="D"
                      size="xs"
                      styles={{
                        input: {
                          height: 28,
                          fontSize: 12
                        },
                        rightSection: {
                          width: 20,
                          pointerEvents: 'none'
                        }
                      }}
                    />
                  </Box>
                  {/* TO: Month */}
                  <Box>
                    <Text size="xs" color="dimmed" mb={2}>Month</Text>
                    <Select
                      data={months}
                      value={String(endMonth)}
                      onChange={(val) => handleDateChange('end', 'month', val)}
                      placeholder="M"
                      size="xs"
                      styles={{
                        input: {
                          height: 28,
                          fontSize: 12
                        },
                        rightSection: {
                          width: 20,
                          pointerEvents: 'none'
                        }
                      }}
                    />
                  </Box>
                  {/* TO: Year */}
                  <Box>
                    <Text size="xs" color="dimmed" mb={2}>Year</Text>
                    <Select
                      data={yearOptions}
                      value={String(endYear)}
                      onChange={(val) => handleDateChange('end', 'year', val)}
                      placeholder="Y"
                      size="xs"
                      styles={{
                        input: {
                          height: 28,
                          fontSize: 12
                        },
                        rightSection: {
                          width: 20,
                          pointerEvents: 'none'
                        }
                      }}
                    />
                  </Box>
                </Group>
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group position="right" mt="xl">
          <Button 
            variant="default" 
            onClick={() => setOpened(false)}
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setOpened(false)}
            size="sm"
          >
            Apply Filters
          </Button>
        </Group>
      </Modal>
    </>
  );
}