// test-api.js
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🔍 Testing AgroDetect API');
    console.log('========================\n');

    // Test 1: Health check
    try {
        const health = await fetch('http://localhost:5000/health');
        const healthData = await health.json();
        console.log('✅ Health check:', healthData.status);
    } catch (error) {
        console.log('❌ Health check failed - server not running');
        console.log('   Start server: node server.js');
        return;
    }

    // Test 2: Register
    console.log('\n📝 Testing Registration...');
    try {
        const register = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testuser${Date.now()}`,
                email: `test${Date.now()}@example.com`,
                password: 'password123'
            })
        });
        const registerData = await register.json();
        
        if (registerData.success) {
            console.log('✅ Registration successful');
            console.log('   User:', registerData.user.username);
            console.log('   Token:', registerData.token.substring(0, 20) + '...');
        } else {
            console.log('❌ Registration failed:', registerData.message);
        }
    } catch (error) {
        console.log('❌ Registration error:', error.message);
    }

    // Test 3: Login with test credentials
    console.log('\n🔐 Testing Login...');
    try {
        const login = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await login.json();
        
        if (loginData.success) {
            console.log('✅ Login successful');
            console.log('   User:', loginData.user.username);
            console.log('   Token:', loginData.token.substring(0, 20) + '...');
        } else {
            console.log('❌ Login failed:', loginData.message);
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
    }

    console.log('\n========================');
}

testAPI();