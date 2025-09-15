import React from 'react';

const Dot = ({ size = 10, color = 'red' }) => {
    const dotStyle = {
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
    };

    return <div style={dotStyle}></div>;
};

export default Dot;