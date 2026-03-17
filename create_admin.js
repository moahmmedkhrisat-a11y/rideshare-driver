const axios = require('axios');

const API_URL = 'http://34.229.194.73:3000';

const adminPhone = '0799999999'; // Stable Admin Phone
const adminPassword = 'adminpassword123'; // Stable Admin Password

async function createAdmin() {
    console.log('--- Creating Stable Admin Account ---');
    try {
        const res = await axios.post(`${API_URL}/api/create-admin-secret`, {
            secret: 'super_secret_setup_key_2026',
            phone: adminPhone,
            password: adminPassword
        });
        console.log('✅ Admin Creation Success:', res.data);
        console.log(`\nUse these credentials:`);
        console.log(`Phone: ${adminPhone}`);
        console.log(`Password: ${adminPassword}`);
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error.includes('already exists')) {
             console.log('⚠️ Admin with this phone number already exists.');
             console.log(`\nTry logging in with:`);
             console.log(`Phone: ${adminPhone}`);
             console.log(`Password: ${adminPassword}`);
        } else {
             console.error('❌ Failed to create Admin:', error.response ? error.response.data : error.message);
        }
    }
}

createAdmin();
