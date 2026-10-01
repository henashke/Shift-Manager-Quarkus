// src/config.ts

// The frontend is served by the Quarkus backend (Quinoa), so the API is on the same origin.
// In dev, the React dev server proxies /api to the backend (see "proxy" in package.json).
let apiBaseUrl = '/api';

if (process.env.REACT_APP_API_BASE_URL) {
  // Use custom API URL if provided
  apiBaseUrl = process.env.REACT_APP_API_BASE_URL + '/api';
}

const config = {
  API_BASE_URL: apiBaseUrl,
};

// Debug logging
console.log('Config loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  API_BASE_URL: config.API_BASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
  apiBaseUrl: apiBaseUrl
});

// Test API call to verify configuration
const testApiCall = async () => {
  try {
    const testUrl = `${config.API_BASE_URL}/auth/login`;
    console.log('Testing API call to:', testUrl);
    console.log('Full URL would be:', window.location.origin + testUrl);
  } catch (error) {
    console.error('Error testing API call:', error);
  }
};

// Run test on config load
testApiCall();

export default config;

