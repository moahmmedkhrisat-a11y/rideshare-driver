const axios = require('axios');

const API_URL = 'http://34.229.194.73:3000';

const adminPhone = '0799999999';
const adminPassword = 'adminpassword123';

const driverPhone = '0788888888'; // Stable Driver Phone
const driverPassword = 'driverpassword123'; // Stable Driver Password

async function createDriver() {
    console.log('--- Creating Stable Driver Account ---');
    try {
        // 1. Signup Driver
        console.log('1. Registering Driver...');
        const signupRes = await axios.post(`${API_URL}/api/signup`, {
            phone: driverPhone,
            password: driverPassword,
            role: 'driver'
        });
        const driverId = signupRes.data.userId;
        console.log('✅ Driver registered. ID:', driverId);

        // 2. Login as Admin to approve
        console.log('\n2. Logging in as Admin for approval...');
        const loginAdminRes = await axios.post(`${API_URL}/api/login`, {
            phone: adminPhone,
            password: adminPassword
        });
        const adminToken = loginAdminRes.data.token;

        // 3. Approve Driver
        console.log('\n3. Approving Driver...');
        const approveRes = await axios.post(`${API_URL}/api/admin/approve-user`, 
            { userId: driverId },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Driver Approved successfully:', approveRes.data);

        console.log(`\n🎉 Success! Use these credentials inside the DRIVER APP:`);
        console.log(`Phone: ${driverPhone}`);
        console.log(`Password: ${driverPassword}`);

    } catch (error) {
        if (error.response && error.response.data && error.response.data.error.includes('already exists')) {
             console.log('⚠️ Driver account already exists on that phone.');
             console.log(`\nTry logging in directly on the Driver App with:`);
             console.log(`Phone: ${driverPhone}`);
             console.log(`Password: ${driverPassword}`);
        } else {
             console.error('❌ Failed to set up driver:', error.response ? error.response.data : error.message);
        }
    }
}

createDriver();
