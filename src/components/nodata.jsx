import React from 'react'
import '../styles/nodata.css'
import { CloudOff } from 'lucide-react';

function NoData() {
  return (
    <div>

        <div className="nodata-container">
            <div className="nodata-content">
            
                <CloudOff className='nodata-icon' size={70} color="#666" />
                <h1>No Data Available</h1>
                <p>Please upload a file to start the analyses</p>
            </div>
    </div>
    </div>
  )
}

export default NoData