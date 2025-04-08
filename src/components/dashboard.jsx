import React from 'react'
import { useSelector } from 'react-redux'
import Header from './header'
import MapChart from './mapchart'
import Chart from './chart'
import SKUChart from './skuchart'
import { GenderChart } from './genderchart'
import '../styles/dashboard.css'
import NoData from './nodata'
import PeriodSelector from './selector'

function Dashboard() {
  // Replace this with your actual data slice from Redux
  const orders = useSelector((state) => state.orders)

  // Check if orders have data
  const isDataLoaded = orders && orders.length > 0

  return (
    <div className="dashboard-wrapper">
      <Header />

      {/* Render charts immediately if data is loaded */}
      {isDataLoaded ? (
        <div className="dashboard-grid">
          <div className="dashboard-card"><Chart /></div>
          <div className="dashboard-card"><MapChart /></div>
          <div className="dashboard-card"><SKUChart /></div>
          <div className="dashboard-card"><GenderChart /></div>
          
        </div>
      ) : (
        <NoData />
      )}
    </div>
  )
}

export default Dashboard