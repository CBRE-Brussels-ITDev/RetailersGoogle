import React from 'react';

// Category Icons Component
export const CategoryIcons = {
  // Food & Dining
  restaurant: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.1,13.34L12,17.77L15.9,13.34L12,8.91L8.1,13.34M12,2L1,9L12,22L23,9L12,2Z"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🍽️</text>
    </svg>
  ),
  
  bakery: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2L13.09,8.26L20,9L14.74,15.74L16,23L12,20L8,23L9.26,15.74L4,9L10.91,8.26L12,2Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🥖</text>
    </svg>
  ),

  // Shopping
  shopping_mall: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19,7H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6V7H5A1,1 0 0,0 4,8V19A3,3 0 0,0 7,22H17A3,3 0 0,0 20,19V8A1,1 0 0,0 19,7Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🛍️</text>
    </svg>
  ),

  store: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,18H6V14H12M21,14V12L20,7H4L3,12V14H4V20H14V14H18V20H20V14M12,10H6V6H12V10Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🏪</text>
    </svg>
  ),

  // Services
  bank: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,1L21,5V7H3V5M4,8H20V11H4M11,12H13V19H20V21H4V19H11"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🏦</text>
    </svg>
  ),

  gas_station: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3,4A2,2 0 0,1 5,2H11A2,2 0 0,1 13,4V12A2,2 0 0,1 11,14H5A2,2 0 0,1 3,12V4M5,4V8H11V4H5Z"/>
      <text x="12" y="18" textAnchor="middle" fontSize="8" fill="white">⛽</text>
    </svg>
  ),

  // Healthcare
  hospital: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M17,13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
      <text x="12" y="7" textAnchor="middle" fontSize="6" fill="white">+</text>
    </svg>
  ),

  pharmacy: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2L13.09,8.26L20,9L14.74,15.74L16,23L12,20L8,23L9.26,15.74L4,9L10.91,8.26L12,2Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">💊</text>
    </svg>
  ),

  // Education & Culture
  school: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🎓</text>
    </svg>
  ),

  library: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">📚</text>
    </svg>
  ),

  // Recreation
  park: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L12,10V22H14V16H18V22H20V16A2,2 0 0,0 18,14H14L18.5,12C18.5,12 21,10.5 21,9Z"/>
      <text x="12" y="18" textAnchor="middle" fontSize="8" fill="white">🌳</text>
    </svg>
  ),

  gym: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.4,6L6,7.4L8.6,10H7A1,1 0 0,0 6,11V13A1,1 0 0,0 7,14H8.6L6,16.6L7.4,18L12,13.4L16.6,18L18,16.6L15.4,14H17A1,1 0 0,0 18,13V11A1,1 0 0,0 17,10H15.4L18,7.4L16.6,6L12,10.6L7.4,6Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">💪</text>
    </svg>
  ),

  // Transportation & Travel
  lodging: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19,7H11V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">🏨</text>
    </svg>
  ),

  tourist_attraction: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">📍</text>
    </svg>
  ),

  // Automotive
  car_repair: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92,2.01C18.72,1.42 18.16,1 17.5,1H6.5C5.84,1 5.29,1.42 5.08,2.01L3,8V16A1,1 0 0,0 4,17H5A1,1 0 0,0 6,16V15H18V16A1,1 0 0,0 19,17H20A1,1 0 0,0 21,16V8L18.92,2.01M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M7.5,4L8.5,6H15.5L16.5,4H7.5Z"/>
      <text x="12" y="18" textAnchor="middle" fontSize="8" fill="white">🔧</text>
    </svg>
  ),

  // Personal Care
  beauty_salon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">💄</text>
    </svg>
  ),

  // Religious
  church: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
      <text x="12" y="18" textAnchor="middle" fontSize="8" fill="white">⛪</text>
    </svg>
  ),

  // Government & Services
  post_office: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">📮</text>
    </svg>
  ),

  // Default
  default: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">📍</text>
    </svg>
  )
};

// Get category color
export const getCategoryColor = (type) => {
  const colors = {
    // Food & Dining
    restaurant: '#e74c3c',
    bakery: '#f39c12',
    
    // Shopping
    shopping_mall: '#9b59b6',
    store: '#3498db',
    grocery_or_supermarket: '#27ae60',
    supermarket: '#27ae60',
    convenience_store: '#16a085',
    department_store: '#8e44ad',
    clothing_store: '#e91e63',
    electronics_store: '#607d8b',
    
    // Services
    bank: '#2ecc71',
    gas_station: '#f1c40f',
    
    // Healthcare
    hospital: '#e74c3c',
    pharmacy: '#1abc9c',
    
    // Education & Culture
    school: '#3498db',
    library: '#9b59b6',
    
    // Recreation
    park: '#27ae60',
    gym: '#e67e22',
    
    // Transportation & Travel
    lodging: '#34495e',
    tourist_attraction: '#f39c12',
    
    // Automotive
    car_repair: '#95a5a6',
    
    // Personal Care
    beauty_salon: '#e91e63',
    
    // Religious
    church: '#8e44ad',
    
    // Government & Services
    post_office: '#34495e',
    
    // Default
    default: '#7f8c8d'
  };
  
  return colors[type] || colors.default;
};

// Get category icon
export const getCategoryIcon = (type) => {
  return CategoryIcons[type] || CategoryIcons.default;
};

// Get category emoji (for text display)
export const getCategoryEmoji = (type) => {
  const emojis = {
    restaurant: '🍽️',
    bakery: '🥖',
    shopping_mall: '🛍️',
    store: '🏪',
    grocery_or_supermarket: '🛒',
    supermarket: '🛒',
    bank: '🏦',
    gas_station: '⛽',
    hospital: '🏥',
    pharmacy: '💊',
    school: '🎓',
    library: '📚',
    park: '🌳',
    gym: '💪',
    lodging: '🏨',
    tourist_attraction: '📍',
    car_repair: '🔧',
    beauty_salon: '💄',
    church: '⛪',
    post_office: '📮',
    convenience_store: '🏪',
    department_store: '🏬',
    clothing_store: '👔',
    electronics_store: '💻',
    florist: '🌺',
    furniture_store: '🛋️',
    hardware_store: '🔨',
    home_goods_store: '🏠',
    jewelry_store: '💎',
    liquor_store: '🍷',
    pet_store: '🐕',
    shoe_store: '👟',
    bicycle_store: '🚲',
    book_store: '📖',
    drugstore: '💊',
    default: '📍'
  };
  
  return emojis[type] || emojis.default;
};

export default CategoryIcons;