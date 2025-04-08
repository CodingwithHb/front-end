// Updated SKUChart with PeriodSelector instead of YearSelector

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { BarChart } from '@mantine/charts'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import PeriodSelector from './selector'
import '../styles/skuchart.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function SKUChart() {
  const orders = useSelector((state) => state.orders)
  const [selectedPeriod, setSelectedPeriod] = useState([
    { day: 1, month: 0, year: dayjs().year() },
    { day: 31, month: 11, year: dayjs().year() },
  ])

  const startDate = dayjs(`${selectedPeriod[0].year}-${selectedPeriod[0].month + 1}-${selectedPeriod[0].day}`)
  const endDate = dayjs(`${selectedPeriod[1].year}-${selectedPeriod[1].month + 1}-${selectedPeriod[1].day}`)

  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'))
  const skuMonthlyData = months.reduce((acc, month) => {
    acc[month] = {}
    return acc
  }, {})

  const filteredOrders = orders.filter(order => {
    const date = order.delivered_date || order.return_date || order.shipped_at
    if (!date) return false

    const orderDate = dayjs(date)
    return orderDate.isSameOrAfter(startDate) && orderDate.isSameOrBefore(endDate)
  })

  filteredOrders.forEach(order => {
    const { sku, delivered_date, return_date, shipped_at } = order
    const date = delivered_date || return_date || shipped_at
    if (!sku || !date) return

    const month = dayjs(date).format('MMM')
    if (!skuMonthlyData[month][sku]) {
      skuMonthlyData[month][sku] = 0
    }
    skuMonthlyData[month][sku]++
  })

  const chartData = months.map(month => {
    const entry = { month }
    Object.keys(skuMonthlyData[month]).forEach(sku => {
      entry[sku] = skuMonthlyData[month][sku]
    })
    return entry
  })

  const uniqueSkus = [...new Set(filteredOrders.map(o => o.sku))]
  const colorPalette = [
    '#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600',
    '#26547D', '#EF476F', '#06D6A0', '#FFD166'
  ]
  const series = uniqueSkus.map((sku, index) => ({
    name: sku,
    color: colorPalette[index % colorPalette.length]
  }))

  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {payload.map((entry, idx) => (
          <div key={idx} style={{ color: entry.color, marginTop: 5 }}>
            {entry.name}: <strong>{entry.value} Orders</strong>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse by SKU</h3>

      <PeriodSelector period={selectedPeriod} setPeriod={setSelectedPeriod} />

      <BarChart
        h={410}
        data={chartData}
        dataKey="month"
        series={series}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        legendProps={{}}
        barSize={50}
        yAxisProps={{
          domain: [0, 100],
          tickInterval: 10
        }}
        tickLine="y"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray'
        }}
      />

      {/* Manual legend */}
      <div className="sku-legend">
        {series.map(({ name, color }) => (
          <div key={name} className="legend-item">
            <div
              className="legend-dot"
              style={{ backgroundColor: color }}
            />
            <span className="legend-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SKUChart
