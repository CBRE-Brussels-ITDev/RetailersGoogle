import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const Modal = ({ isOpen, onClose, data }) => {
    // Ensure the data is an object
    if (!isOpen || typeof data !== 'object' || data === null) return null;

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet([data.data.result]); // Wrap data in an array for export
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'export.xlsx');
    };

    const renderObject = (obj, parentKey = '') => {
        const groupedRows = [];
    
        Object.entries(obj).forEach(([key, value]) => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
    
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    // Handle arrays of objects like address_components or reviews
                    if (key === 'address_components' || key === 'reviews') {
                        groupedRows.push(
                            <tr key={fullKey}>
                                <td colSpan="2" style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                    {fullKey}
                                </td>
                            </tr>
                        );
                        value.forEach((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                // Render each object in the array as its own rows
                                Object.entries(item).forEach(([subKey, subValue]) => {
                                    groupedRows.push(
                                        <tr key={`${fullKey}[${index}].${subKey}`}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>{`${fullKey}[${index}].${subKey}`}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                                                {typeof subValue === 'object' ? JSON.stringify(subValue, null, 2) : subValue?.toString()}
                                            </td>
                                        </tr>
                                    );
                                });
                            } else {
                                // Render non-object array items
                                groupedRows.push(
                                    <tr key={`${fullKey}[${index}]`}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>{`${fullKey}[${index}]`}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                                            {item?.toString()}
                                        </td>
                                    </tr>
                                );
                            }
                        });
                    } else {
                        // Render arrays as JSON strings
                        groupedRows.push(
                            <tr key={fullKey}>
                                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>{fullKey}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                                    {JSON.stringify(value, null, 2)}
                                </td>
                            </tr>
                        );
                    }
                } else {
                    // Add a row for the parent key and recursively render nested objects
                    groupedRows.push(
                        <tr key={fullKey}>
                            <td colSpan="2" style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                {fullKey}
                            </td>
                        </tr>
                    );
                    groupedRows.push(...renderObject(value, fullKey));
                }
            } else {
                groupedRows.push(
                    <tr key={fullKey}>
                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>{fullKey}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                            {value?.toString()}
                        </td>
                    </tr>
                );
            }
        });
    
        return groupedRows;
    };
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button style={styles.closeButton} onClick={onClose}>
                    Close
                </button>
                <h2>Place Details</h2>
                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Key</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>{renderObject(data.data.result)}</tbody>
                    </table>
                </div>
                <button style={styles.exportButton} onClick={handleExport}>
                    Export to Excel
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        width: '80%', // Make the modal wider
        maxWidth: '800px', // Limit the maximum width
        textAlign: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
    },
    exportButton: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default Modal;