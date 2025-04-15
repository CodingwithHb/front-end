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

  // New state to store the selected SKU (default is "All")
  const [selectedSku, setSelectedSku] = useState("All")

  const startDate = dayjs(`${selectedPeriod[0].year}-${selectedPeriod[0].month + 1}-${selectedPeriod[0].day}`)
  const endDate = dayjs(`${selectedPeriod[1].year}-${selectedPeriod[1].month + 1}-${selectedPeriod[1].day}`)

  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'))
  
  // Prepare an object to accumulate SKU data per month.
  const skuMonthlyData = months.reduce((acc, month) => {
    acc[month] = {}
    return acc
  }, {})

  // Filter orders based on the period.
  const filteredOrders = orders.filter(order => {
    const date = order.delivered_date || order.return_date || order.shipped_at
    if (!date) return false
    const orderDate = dayjs(date)
    return orderDate.isSameOrAfter(startDate) && orderDate.isSameOrBefore(endDate)
  })

  // Aggregate SKU counts for each month.
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

  // Prepare chartData: an array of objects per month where each object may include multiple SKU keys.
  const chartData = months.map(month => {
    const entry = { month }
    Object.keys(skuMonthlyData[month]).forEach(sku => {
      entry[sku] = skuMonthlyData[month][sku]
    })
    return entry
  })

  // Compute the list of unique SKUs from the filtered orders.
  const uniqueSkus = [...new Set(filteredOrders.map(o => o.sku))]

  // Define a color palette.
  const colorPalette = [
    '#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600',
    '#26547D', '#EF476F', '#06D6A0', '#FFD166'
  ]
  // Create series for all SKUs.
  const series = uniqueSkus.map((sku, index) => ({
    name: sku,
    color: colorPalette[index % colorPalette.length]
  }))

  // If a specific SKU is selected, we build filtered chart data and series.
  const currentChartData = selectedSku === "All"
    ? chartData
    : chartData.map(data => ({
        month: data.month,
        [selectedSku]: data[selectedSku] || 0
      }))

  const currentSeries = selectedSku === "All"
    ? series
    : (() => {
        // Get the color based on its position in the uniqueSkus array (or default to first color).
        const index = uniqueSkus.indexOf(selectedSku)
        const color = index >= 0 ? colorPalette[index % colorPalette.length] : colorPalette[0]
        return [{ name: selectedSku, color }]
      })()

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

      {/* New SKU selector: choose "All" or a specific SKU */}
      <div className="sku-selector">
        <label htmlFor="skuSelect">Select SKU: </label>
        <select
          id="skuSelect"
          value={selectedSku}
          onChange={(e) => setSelectedSku(e.target.value)}
        >
          <option value="All">All</option>
          {uniqueSkus.map((sku) => (
            <option key={sku} value={sku}>
              {sku}
            </option>
          ))}
        </select>
      </div>

      <BarChart
        h={410}
        data={currentChartData}
        dataKey="month"
        series={currentSeries}
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

      {/* Manual legend based on the current series */}
      <div className="sku-legend">
        {currentSeries.map(({ name, color }) => (
          <div key={name} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: color }} />
            <span className="legend-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SKUChart
