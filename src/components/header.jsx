import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/header.css';
import Filter from './filter';
import { useSelector } from 'react-redux';

function Header() {
  const [statistics, setStatistics] = useState({});
  const reduxOrders = useSelector(state => state.orders);

  const fetchStatistics = (params = {}) => {
    axios.get('http://localhost:8000/api/statistics', { params })
      .then((response) => { 
        const fetchedOrders = response.data.orders;
        setStatistics({
          total_orders: fetchedOrders.length,
          total_customers: new Set(fetchedOrders.map(order => order.customer_name)).size,
          delivered_orders: fetchedOrders.filter(order => order.status === 'Delivered').length,
          returned_orders: fetchedOrders.filter(order => order.status === 'Return').length
        });
      })
      .catch((error) => { 
        console.log('Error:', error); 
      });
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Re-fetch statistics when reduxOrders change (after a new import, for example)
  useEffect(() => {
    if (reduxOrders && reduxOrders.length > 0) {
      fetchStatistics();
    }
  }, [reduxOrders]);

  return (
    <div>
      <Filter onStatisticsUpdate={fetchStatistics} statistics={statistics} />
      <div className="container">
        <div className="statistics-card">
          <img src="/orders.svg" alt="orders" />
          <h2>Total Order</h2>
          <p>{statistics.total_orders?.toLocaleString()}</p>
        </div>
        <div className="statistics-card">
          <img src="/Delivered.svg" alt="Delivered" />
          <h2>Total Orders Delivered</h2>
          <p>{statistics.delivered_orders?.toLocaleString()}</p>
        </div>
        <div className="statistics-card">
          <img src="/Return.svg" alt="Return" />
          <h2>Total Orders Returned</h2>
          <p>{statistics.returned_orders?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Header;
