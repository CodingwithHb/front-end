import React from 'react'
import dayjs from 'dayjs'

const PeriodSelector = ({ period, setPeriod }) => {
  const generateRange = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const handleChange = (type, field, value) => {
    setPeriod(prev => {
      const newPeriod = [...prev]
      newPeriod[type === 'start' ? 0 : 1] = {
        ...newPeriod[type === 'start' ? 0 : 1],
        [field]: Number(value)
      }
      return newPeriod
    })
  }

  return (
    <div className="period-selector">
      {['start', 'end'].map((type, index) => (
        <div key={type} className="period-section">
          <span>{type === 'start' ? 'From' : 'To'}</span>
          <select
            value={period[index].day}
            onChange={(e) => handleChange(type, 'day', e.target.value)}
          >
            {generateRange(1, 31).map(d =>
              <option key={d} value={d}>{d}</option>
            )}
          </select>
          <select
            value={period[index].month}
            onChange={(e) => handleChange(type, 'month', e.target.value)}
          >
            {months.map((m, i) =>
              <option key={i} value={i}>{m}</option>
            )}
          </select>
          <select
            className="year-select"
            value={period[index].year}
            onChange={(e) => handleChange(type, 'year', e.target.value)}
          >
            {generateRange(2022, 2030).map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
        </div>
      ))}

      <style jsx>{`
        .period-selector {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
          gap: 20px;
        }

        .period-section {
          background: #f7f7f7;
          padding: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.05);
          font-weight: 500;
        }

        .period-section span {
          color: #333;
          margin-right: 4px;
        }

        .period-section select {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 4px;
          font-size: 12px;
          background: #fff;
          color: #333;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .period-section select:hover {
          border-color: #888;
        }

        /* Center the text inside the year select */
        .period-section .year-select {
          text-align: center;
          text-align-last: center;
        }
      `}</style>
    </div>
  )
}

export default PeriodSelector
