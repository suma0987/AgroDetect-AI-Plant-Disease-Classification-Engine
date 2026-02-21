// api.js
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            console.log(`🌐 Making request to: ${url}`, options);
            
            const response = await fetch(url, { 
                ...options, 
                headers,
                mode: 'cors',
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log('📥 Response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data, isFormData = false) {
        const options = {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data)
        };
        
        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }
        
        return this.request(endpoint, options);
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}

// Create global API instance
const api = new ApiService();