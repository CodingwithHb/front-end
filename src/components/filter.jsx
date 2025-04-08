import React, { useState } from 'react'
import Import from './import'
import '../styles/filter.css'
import { ImportIcon } from 'lucide-react' // ✅ Lucide icon

function Filter() {
  const [showImportModal, setShowImportModal] = useState(false)

  return (
    <div className="import-only-wrapper">
      <button
        className="action-button import-button"
        onClick={() => setShowImportModal(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ImportIcon size={18} />
        Import
      </button>

      <Import
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  )
}

export default Filter
