const Admin = require('../models/Admin');
const dotenv = require('dotenv');
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ isSuperAdmin: true });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.username);
      return;
    }

    // Get super admin credentials from environment variables
    const superAdminData = {
      username: process.env.SUPER_ADMIN_USERNAME ,
      password: process.env.SUPER_ADMIN_PASSWORD,
      email: process.env.SUPER_ADMIN_EMAIL ,
      fingerprintID: parseInt(process.env.SUPER_ADMIN_FINGERPRINT_ID),
      isSuperAdmin: true
    };

    // Create super admin
    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();
    
    console.log('✅ Super admin created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.log('Super admin with this data already exists');
    }
  }
};

module.exports = { createSuperAdmin };
