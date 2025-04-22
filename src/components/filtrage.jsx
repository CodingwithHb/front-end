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

// Styles CSS personnalisés
const customStyles = {
  modal: {
    maxWidth: 450,
    boxShadow: '0 10px 35px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px'
  },
  header: {
    padding: '20px 25px',
    borderBottom: '1px solid #eaeaea',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px'
  },
  title: {
    marginBottom: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#334155'
  },
  body: {
    padding: '25px'
  },
  summaryBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '20px'
  },
  summaryItem: {
    marginBottom: '8px'
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 500
  },
  summaryValue: {
    color: '#334155',
    fontSize: '14px',
    fontWeight: 600
  },
  accordion: {
    border: 'none',
    marginBottom: '20px'
  },
  accordionItem: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  accordionHeader: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px'
  },
  accordionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#334155'
  },
  accordionPanel: {
    padding: '16px',
    backgroundColor: 'white'
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px'
  },
  sublabel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '4px'
  },
  select: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus, &:hover': {
      borderColor: '#90cdf4',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
    }
  },
  footer: {
    padding: '15px 25px',
    borderTop: '1px solid #eaeaea',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px'
  },
  cancelButton: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: 500,
    marginRight: '10px',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f1f5f9'
    }
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2563eb'
    }
  }
};

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
      height: 36,
      fontSize: 14,
      minHeight: 'auto',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      '&:focus': {
        borderColor: '#90cdf4',
        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
      }
    },
    rightSection: {
      pointerEvents: 'none',
      width: 30,
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
            leftIcon={<IconFilter />}
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
          modal: { ...customStyles.modal },
          header: { ...customStyles.header },
          title: { ...customStyles.title },
          body: { ...customStyles.body },
          close: { 
            color: '#64748b',
            '&:hover': { 
              backgroundColor: '#f1f5f9',
              color: '#334155'
            }
          }
        }}
        padding={0}
      >
        <div style={customStyles.body}>
          <Box style={customStyles.summaryBox}>
            <div style={customStyles.summaryItem}>
              <Group position="apart">
                <Text style={customStyles.summaryLabel}>Active Filters</Text>
                <Text style={customStyles.summaryValue}>{getFilterSummary()}</Text>
              </Group>
            </div>
            <div style={customStyles.summaryItem}>
              <Group position="apart">
                <Text style={customStyles.summaryLabel}>Date Range</Text>
                <Text style={customStyles.summaryValue}>{getDateRangeSummary()}</Text>
              </Group>
            </div>
          </Box>

          {/* Accordion for collapsible sections */}
          <Accordion 
            variant="separated" 
            defaultValue={["products", "dates"]} 
            multiple
            styles={{
              root: { ...customStyles.accordion },
              item: { ...customStyles.accordionItem },
              control: { ...customStyles.accordionHeader },
              label: { ...customStyles.accordionTitle },
              panel: { ...customStyles.accordionPanel }
            }}
          >
            {/* Product Filters */}
            <Accordion.Item value="products">
              <Accordion.Control icon={<IconPackage size={16} style={{ color: '#3b82f6' }} />}>
                Product Filters
              </Accordion.Control>
              <Accordion.Panel>
                <Box mb="md">
                  <Text style={customStyles.label}>
                    SKU
                  </Text>
                  <Select
                    data={skuData}
                    value={filterSku}
                    onChange={handleSkuChange}
                    placeholder="Select SKU"
                    size="sm"
                    styles={selectStyles}
                    sx={{ width: '100%' }}
                  />
                </Box>

                <Box mb="md">
                  <Text style={customStyles.label}>
                    Status
                  </Text>
                  <Select
                    data={statusData}
                    value={filterStatus}
                    onChange={handleStatusChange}
                    placeholder="Select Status"
                    size="sm"
                    styles={selectStyles}
                    sx={{ width: '100%' }}
                  />
                </Box>

                <Box>
                  <Text style={customStyles.label}>
                    Gender
                  </Text>
                  <Select
                    data={genderData}
                    value={filterGender}
                    onChange={handleGenderChange}
                    placeholder="Select Gender"
                    size="sm"
                    styles={selectStyles}
                    sx={{ width: '100%' }}
                  />
                </Box>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Date Filters */}
            <Accordion.Item value="dates">
              <Accordion.Control icon={<IconCalendar size={16} style={{ color: '#3b82f6' }} />}>
                Date Range
              </Accordion.Control>
              <Accordion.Panel>
                {/* FROM */}
                <Box mb="lg">
                  <Text style={customStyles.label}>
                    From
                  </Text>
                  <Group spacing={8} grow>
                    {/* FROM: Day */}
                    <Box>
                      <Text style={customStyles.sublabel}>Day</Text>
                      <Select
                        data={dayOptions}
                        value={String(startDay)}
                        onChange={(val) => handleDateChange('start', 'date', val)}
                        placeholder="D"
                        size="sm"
                        styles={selectStyles}
                      />
                    </Box>
                    {/* FROM: Month */}
                    <Box>
                      <Text style={customStyles.sublabel}>Month</Text>
                      <Select
                        data={months}
                        value={String(startMonth)}
                        onChange={(val) => handleDateChange('start', 'month', val)}
                        placeholder="M"
                        size="sm"
                        styles={selectStyles}
                      />
                    </Box>
                    {/* FROM: Year */}
                    <Box>
                      <Text style={customStyles.sublabel}>Year</Text>
                      <Select
                        data={yearOptions}
                        value={String(startYear)}
                        onChange={(val) => handleDateChange('start', 'year', val)}
                        placeholder="Y"
                        size="sm"
                        styles={selectStyles}
                      />
                    </Box>
                  </Group>
                </Box>

                {/* TO */}
                <Box>
                  <Text style={customStyles.label}>
                    To
                  </Text>
                  <Group spacing={8} grow>
                    {/* TO: Day */}
                    <Box>
                      <Text style={customStyles.sublabel}>Day</Text>
                      <Select
                        data={dayOptions}
                        value={String(endDay)}
                        onChange={(val) => handleDateChange('end', 'date', val)}
                        placeholder="D"
                        size="sm"
                        styles={selectStyles}
                      />
                    </Box>
                    {/* TO: Month */}
                    <Box>
                      <Text style={customStyles.sublabel}>Month</Text>
                      <Select
                        data={months}
                        value={String(endMonth)}
                        onChange={(val) => handleDateChange('end', 'month', val)}
                        placeholder="M"
                        size="sm"
                        styles={selectStyles}
                      />
                    </Box>
                    {/* TO: Year */}
                    <Box>
                      <Text style={customStyles.sublabel}>Year</Text>
                      <Select
                        data={yearOptions}
                        value={String(endYear)}
                        onChange={(val) => handleDateChange('end', 'year', val)}
                        placeholder="Y"
                        size="sm"
                        styles={selectStyles}
                      />
                    </Box>
                  </Group>
                </Box>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </div>

        <div style={customStyles.footer}>
          <Button 
            variant="subtle" 
            onClick={() => setOpened(false)}
            size="sm"
            styles={{ 
              root: customStyles.cancelButton
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setOpened(false)}
            size="sm"
            styles={{
              root: customStyles.applyButton
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Modal>
    </>
  );
}