// Updated GenderChart with PeriodSelector instead of YearSelector

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { LineChart } from '@mantine/charts'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import PeriodSelector from './selector'
import '../styles/genderchart.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export function GenderChart() {
  const orders = useSelector((state) => state.orders)
  const [selectedPeriod, setSelectedPeriod] = useState([
    { day: 1, month: 0, year: dayjs().year() },
    { day: 31, month: 11, year: dayjs().year() },
  ])

  const startDate = dayjs(`${selectedPeriod[0].year}-${selectedPeriod[0].month + 1}-${selectedPeriod[0].day}`)
  const endDate = dayjs(`${selectedPeriod[1].year}-${selectedPeriod[1].month + 1}-${selectedPeriod[1].day}`)

  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'))
  const genderMonthlyData = months.reduce((acc, month) => {
    acc[month] = { Male: 0, Female: 0 }
    return acc
  }, {})

  orders.forEach(order => {
    const { gender, delivered_date, return_date, shipped_at } = order
    const date = delivered_date || return_date || shipped_at
    if (!gender || !date) return

    const orderDate = dayjs(date)
    if (!orderDate.isSameOrAfter(startDate) || !orderDate.isSameOrBefore(endDate)) return

    const month = dayjs(date).format('MMM')
    if (gender === 'male') {
      genderMonthlyData[month].Male++
    } else if (gender === 'female') {
      genderMonthlyData[month].Female++
    }
  })

  const chartData = months.map(month => ({
    month,
    Male: genderMonthlyData[month].Male,
    Female: genderMonthlyData[month].Female,
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
      <h3 className="chart-title">Analyse by Gender</h3>
      <PeriodSelector period={selectedPeriod} setPeriod={setSelectedPeriod} />
      <LineChart
        h={400}
        data={chartData}
        dataKey="month"
        series={[
          { name: 'Male', color: '#2D9CDB' },
          { name: 'Female', color: '#EB5757' },
        ]}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        
        yAxisProps={{
          domain: [0, 100],
          tickInterval: 10
        }}
        curveType="linear"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray'
        }}
      />
      <div className="manual-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#2D9CDB' }} />
          <span className="legend-label">Male</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#EB5757' }} />
          <span className="legend-label">Female</span>
        </div>
      </div>
    </div>
  )
}

export default GenderChart