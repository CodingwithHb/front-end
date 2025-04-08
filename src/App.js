import React, { useEffect, useState } from 'react'
import Import from './components/import'
import Header from './components/header'
import DateFilter from './components/filter'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Dashboard from './components/dashboard'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOrders } from './redux/actions'

function App() {
 
    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(fetchOrders()); // Déclenche la récupération des données
    }, [dispatch]);
const { orders, sku, loading, error } = useSelector(state => state);
    
  return (
    <BrowserRouter >
       <Routes>
      
          <Route path="/" element={<Import />} />
          <Route path="/dashboard" element={<Dashboard    />} /> 
         
       </Routes>
       

    </BrowserRouter>
    
  )
}

export default App