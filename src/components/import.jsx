import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { 
  Modal, 
  Text, 
  Group, 
  Button, 
  Badge, 
  ThemeIcon, 
  Paper, 
  Center 
} from '@mantine/core';
import { BeatLoader } from "react-spinners";
import { notifications } from '@mantine/notifications';
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { fetchOrders } from '../redux/actions';
import { 
  Upload as UploadIcon, 
  FileSpreadsheet, 
  X, 
  Check 
} from 'lucide-react';

const Import = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const handleImport = async () => {
    if (!file) {
      notifications.show({
        title: 'Error',
        message: 'Please select a file to import',
        color: 'red',
        icon: <X size={18} />
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      await axios.post("http://localhost:8000/api/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await dispatch(fetchOrders());

      notifications.show({
        title: 'Success',
        message: 'File uploaded successfully',
        color: 'green',
        icon: <Check size={18} />
      });

      navigate("/dashboard");
      onClose();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Upload Failed',
        message: 'Unable to import file. Please try again.',
        color: 'red',
        icon: <X size={18} />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1
  });

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group>
          <ThemeIcon variant="light" color="blue">
            <UploadIcon size={18} />
          </ThemeIcon>
          <Text weight={600}>Import Orders</Text>
        </Group>
      }
      centered
      size="lg"
    >
      {isLoading ? (
        <Center my="xl">
          <Paper p="xl" radius="md" withBorder>
            <Group direction="column" align="center">
              <BeatLoader color="#4960aa" margin={10} size={24} />
              <Text color="dimmed" size="sm">Uploading file...</Text>
            </Group>
          </Paper>
        </Center>
      ) : (
        <>
          <Paper 
            {...getRootProps()} 
            withBorder 
            radius="md" 
            p="xl" 
            mb="md"
            sx={(theme) => ({
              borderStyle: 'dashed',
              borderColor: theme.colors.blue[4],
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: theme.colors.gray[0]
              }
            })}
          >
            <input {...getInputProps()} />
            <Center>
              <Group direction="column" align="center">
                <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                  <FileSpreadsheet size={32} />
                </ThemeIcon>
                <Text weight={600} size="lg" align="center">
                  Drag and drop your file here
                </Text>
                <Text color="dimmed" size="sm" align="center">
                  Supported formats: .xlsx, .csv
                </Text>
                <Button variant="light" color="blue">
                  Select File
                </Button>
              </Group>
            </Center>
          </Paper>

          {file && (
            <Group position="apart" mb="md">
              <Group>
                <ThemeIcon color="green" variant="light">
                  <FileSpreadsheet size={18} />
                </ThemeIcon>
                <Text size="sm" weight={500}>
                  {file.name}
                </Text>
              </Group>
              <Badge color="green" variant="light">
                {(file.size / 1024).toFixed(2)} KB
              </Badge>
            </Group>
          )}

          <Button 
            fullWidth 
            onClick={handleImport} 
            disabled={!file}
            leftIcon={<UploadIcon size={18} />}
          >
            Upload File
          </Button>
        </>
      )}
    </Modal>
  );
};

export default Import;