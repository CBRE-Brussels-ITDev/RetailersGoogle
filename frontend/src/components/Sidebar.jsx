import React from 'react';

const Sidebar = ({ descriptions }) => {
    return (
        <div className="sidebar">
            
            <h2>Descriptions</h2>
            <ul>
                {descriptions.map((desc, index) => (
                    <li key={index}>{desc}</li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;