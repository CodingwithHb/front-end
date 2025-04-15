import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { BarChart } from '@mantine/charts'
import dayjs from 'dayjs'
import PeriodSelector from './selector' // NEW
import '../styles/chart.css'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)


function Chart() {
  const orders = useSelector((state) => state.orders)
  const [selectedPeriod, setSelectedPeriod] = useState([
    { day: 1, month: 0, year: dayjs().year() },
    { day: 31, month: 11, year: dayjs().year() }
  ])
  
  const startDate = dayjs(`${selectedPeriod[0].year}-${selectedPeriod[0].month + 1}-${selectedPeriod[0].day}`)
  const endDate = dayjs(`${selectedPeriod[1].year}-${selectedPeriod[1].month + 1}-${selectedPeriod[1].day}`)
  
  const filteredOrders = orders.filter(order => {
    const rawDate = order.delivered_date || order.return_date || order.shipped_at
    if (!rawDate) return false
  
    const orderDate = dayjs(rawDate)
    return orderDate.isSameOrAfter(startDate) && orderDate.isSameOrBefore(endDate)
  })

  const monthlyData = Array.from({ length: 12 }, (_, index) => ({
    month: dayjs().month(index).format('MMM'),
    Delivered: 0,
    Returned: 0,
  }))

  filteredOrders.forEach(order => {
    const status = order.status
    const date = order.delivered_date || order.return_date || order.shipped_at
    if (!date) return

    const monthIndex = dayjs(date).month()
    if (status === 'Delivered') {
      monthlyData[monthIndex].Delivered++
    } else if (status === 'Return') {
      monthlyData[monthIndex].Returned++
    }
  })

  const CustomTooltip = ({ label, payload }) => {
    if (!payload || payload.length === 0) return null
    return (
      <div className="chartTooltip">
        <strong>{label}</strong>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, marginTop: 5 }}>
            {entry.name}: <strong>{entry.value} Orders</strong>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Analyse by status</h3>

      <PeriodSelector  period={selectedPeriod} setPeriod={setSelectedPeriod }  />

      <BarChart
        h={400}
        data={monthlyData}
        dataKey="month"
        series={[
          { name: 'Delivered', color: '#7dd87d' },
          { name: 'Returned', color: '#bc2525' },
        ]}
        tooltipProps={{ shared: true, content: CustomTooltip }}
        barSize={40}
        yAxisProps={{ domain: [0, 1000], tickInterval: 5 }}
        tickLine="y"
        style={{
          overflow: 'visible',
          '--chart-cursor-fill': '#e5e1e1',
          '--chart-grid-color': 'gray',
          '--chart-text-color': 'gray'
        }}
      />

      <div className="manual-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#7dd87d' }} />
          <span className="legend-label">Delivered</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#bc2525' }} />
          <span className="legend-label">Returned</span>
        </div>
      </div>
    </div>
  )
}

export default Chart
