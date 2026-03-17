const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'http://34.229.194.73:3000';

async function runTest() {
    console.log('--- starting Backend & API Tests ---');
    try {
        // 1. Create Admin
        console.log('1. Creating Master Admin...');
        const adminPhone = 'admin_test_' + Date.now();
        const adminRes = await axios.post(`${API_URL}/api/create-admin-secret`, {
            secret: 'super_secret_setup_key_2026',
            phone: adminPhone,
            password: 'adminpassword123'
        });
        console.log('✅ Admin creation response:', adminRes.data);

        // 2. Login as Admin
        console.log('\n2. Logging in as Admin...');
        const loginAdminRes = await axios.post(`${API_URL}/api/login`, {
            phone: adminPhone,
            password: 'adminpassword123'
        });
        const adminToken = loginAdminRes.data.token;
        console.log('✅ Admin Login successful. Token obtained.');

        // 3. Signup Driver
        console.log('\n3. Signing up a Driver...');
        const driverPhone = 'driver_test_' + Date.now();
        const signupDriverRes = await axios.post(`${API_URL}/api/signup`, {
            phone: driverPhone,
            password: 'driverpassword123',
            role: 'driver'
        });
        console.log('✅ Driver Signup response:', signupDriverRes.data);
        const driverId = signupDriverRes.data.userId;

        // 4. Approve Driver
        console.log('\n4. Approving Driver via Admin...');
        const approveDriverRes = await axios.post(`${API_URL}/api/admin/approve-user`, 
            { userId: driverId },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Driver Approved:', approveDriverRes.data);

        // 5. Login as Driver
        console.log('\n5. Logging in as Driver...');
        const loginDriverRes = await axios.post(`${API_URL}/api/login`, {
            phone: driverPhone,
            password: 'driverpassword123'
        });
        console.log('✅ Driver Login successful. Role:', loginDriverRes.data.user.role);

        // 6. Signup Customer
        console.log('\n6. Signing up a Customer...');
        const customerPhone = 'customer_test_' + Date.now();
        const signupCustomerRes = await axios.post(`${API_URL}/api/signup`, {
            phone: customerPhone,
            password: 'customerpassword123',
            role: 'customer'
        });
        console.log('✅ Customer Signup response:', signupCustomerRes.data);
        const customerId = signupCustomerRes.data.userId;

        // 7. Approve Customer
        console.log('\n7. Approving Customer via Admin...');
        const approveCustomerRes = await axios.post(`${API_URL}/api/admin/approve-user`, 
            { userId: customerId },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Customer Approved:', approveCustomerRes.data);

        // 8. Login as Customer
        console.log('\n8. Logging in as Customer...');
        const loginCustomerRes = await axios.post(`${API_URL}/api/login`, {
            phone: customerPhone,
            password: 'customerpassword123'
        });
        console.log('✅ Customer Login successful. Role:', loginCustomerRes.data.user.role);

        console.log('\n--- Auth & Admin Verification PASSED ---');

        // 9. Socket.io Real-time Test
        console.log('\n9. Testing Socket.io Real-time Connection (Two-Socket Simulation)...');
        
        const customerSocket = io(API_URL);
        const driverSocket = io(API_URL);

        let tripCreated = false;

        driverSocket.on('connect', () => {
            console.log('✅ Driver socket connected.');
        });

        customerSocket.on('connect', () => {
            console.log('✅ Customer socket connected.');
            
            // Wait for driver socket to also be ready
            setTimeout(() => {
                console.log('\nSimulating Trip Request...');
                customerSocket.emit('request_trip', {
                    riderId: customerId,
                    pickup: { lat: 31.9522, lng: 35.9106 }, 
                    dropoff: { lat: 31.9631, lng: 35.9304 }
                });
                tripCreated = true;
            }, 1000);
        });

        // Driver listens for trip request
        driverSocket.on('new_trip_request', (trip) => {
            console.log('✅ Driver received `new_trip_request` event for Trip:', trip.tripId);
            
            console.log('\nSimulating Trip Acceptance...');
            driverSocket.emit('accept_trip', {
                tripId: trip.tripId,
                driverId: driverId
            });
        });

        // Customer listens for status updates
        customerSocket.on('trip_status_updated', (tripUpdate) => {
             console.log('✅ Customer received `trip_status_updated` event:', tripUpdate);
             if (tripUpdate.status === 'accepted') {
                 console.log('\n✅ Real-time Trip Creation Flow Completed Successfully!');
                 customerSocket.disconnect();
                 driverSocket.disconnect();
                 process.exit(0);
             }
        });

        setTimeout(() => {
            if (!tripCreated) return; // Might still be connecting
            console.log('\n❌ Socket timeout - tests hung or event missed.');
            customerSocket.disconnect();
            driverSocket.disconnect();
            process.exit(1);
        }, 15000);


    } catch (error) {
        console.error('\n❌ Test Failed with Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

runTest();
