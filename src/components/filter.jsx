import React, { useState } from 'react';
import { 
  Button, 
  Modal, 
  Group, 
  ThemeIcon, 
  Text 
} from '@mantine/core';
import { ImportIcon, X } from 'lucide-react';
import Import from './import';
import { notifications } from '@mantine/notifications';

function Filter() {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = () => {
    notifications.show({
      title: 'Import Successful',
      message: 'Your orders have been imported successfully.',
      color: 'green',
      icon: <ImportIcon size={16} />
    });
  };

  return (
    <Group position="apart" py="md" >
      <Button
        variant="light"
        color="blue"
        onClick={() => setShowImportModal(true)}
      >
        <Group spacing="xs">
          <ImportIcon size={18} />
          <Text style={{fontWeight:"bold"}}>Import Orders</Text>
        </Group>
      </Button>

      <Import
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </Group>
  );
}

export default Filter;