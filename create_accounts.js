const axios = require('axios');

const API_URL = 'http://34.229.194.73:3000';

const adminPhone = '0777986116'; // Your Admin Account
const adminPassword = '160396@Sa';

// Suffix to make phone numbers unique for each role
const driverPhone = '07779861161'; // Driver
const customerPhone = '07779861162'; // Customer
const commonPassword = '160396@Sa';

async function setupAccounts() {
    console.log('--- Creating Driver & Customer Accounts ---');
    try {
        // 1. Login as Admin to approve
        console.log('1. Logging in as Admin for approval token...');
        const adminLogin = await axios.post(`${API_URL}/api/login`, {
            phone: adminPhone,
            password: adminPassword
        });
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin Token obtained.');

        // 2. Create Driver
        console.log('\n2. Registering Driver...');
        const signupDriver = await axios.post(`${API_URL}/api/signup`, {
            phone: driverPhone,
            password: commonPassword,
            role: 'driver'
        });
        const driverId = signupDriver.data.userId;
        console.log('✅ Driver registered. ID:', driverId);

        // 3. Approve Driver
        console.log('3. Approving Driver...');
        await axios.post(`${API_URL}/api/admin/approve-user`, 
            { userId: driverId },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Driver Approved.');

        // 4. Create Customer
        console.log('\n4. Registering Customer...');
        const signupCustomer = await axios.post(`${API_URL}/api/signup`, {
            phone: customerPhone,
            password: commonPassword,
            role: 'customer'
        });
        const customerId = signupCustomer.data.userId;
        console.log('✅ Customer registered. ID:', customerId);

        // 5. Approve Customer
        console.log('5. Approving Customer...');
        await axios.post(`${API_URL}/api/admin/approve-user`, 
            { userId: customerId },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Customer Approved.');

        console.log(`\n🎉 Accounts successfully created and approved!`);
        console.log(`Use these numbers inside each respective App to login:`);
        console.log(`🚗 Driver App Phone  : ${driverPhone}`);
        console.log(`👥 Customer App Phone: ${customerPhone}`);
        console.log(`🔑 Shared Password   : ${commonPassword}`);

    } catch (error) {
         console.error('\n❌ Failed Setup Account:', error.response ? error.response.data : error.message);
    }
}

setupAccounts();
