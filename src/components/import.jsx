import { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { BeatLoader } from "react-spinners";
import "../styles/import.css";
import { useNavigate } from "react-router-dom";
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDispatch } from 'react-redux';
import { fetchOrders } from '../redux/actions'; // make sure the path is correct

const Import = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const handleImport = async () => {
    if (!file) return alert("Please select a file to import");

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
        title: 'Upload Status',
        message: 'successfully uploaded  🌟',
      })
      navigate("/dashboard");
      onClose(); // Close modal after success
    } catch (error) {
      console.log(error);
      alert("Failed to import file");
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
  });

  if (!isOpen) return null; // Prevent rendering when modal is closed

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>✖</button>

        {isLoading ? (
          <div className="loading-overlay" >

            <BeatLoader color="#4960aa" margin={10} size={24} />
            <p className="mt-4 text-gray-600">Uploading file...</p>
          </div>
        ) : (
          <>
            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              <h3 className="title">Select file to upload</h3>
              <p className="subtitle">Supported formats: xlsx, csv</p>
              <button type="button" className="button">Select file</button>
            </div>
            {file && <p className="fileName">Selected file: {file.name}</p>}
            <button type="button" onClick={handleImport} className="upload-button">
              Upload
            </button>
          </>
        )}
      </div>

   
    </div>
  );
};

export default Import;
