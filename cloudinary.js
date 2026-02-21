// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath) => {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        // If Cloudinary is not configured, return a local URL instead
        if (!process.env.CLOUDINARY_CLOUD_NAME || 
            process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
            console.log('⚠️ Cloudinary not configured, using local file storage');
            
            // Return a local URL (you'll need to serve static files)
            const filename = filePath.split('\\').pop();
            return `/uploads/${filename}`;
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'agrodetect',
            use_filename: true,
            unique_filename: true
        });

        console.log('✅ File uploaded to Cloudinary:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        
        // Fallback: return local path
        const filename = filePath.split('\\').pop();
        return `/uploads/${filename}`;
    }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || 
            process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
            return { result: 'skipped' };
        }

        const result = await cloudinary.uploader.destroy(publicId);
        console.log('✅ File deleted from Cloudinary:', result);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error);
        return { result: 'error' };
    }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return null;
    
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return `agrodetect/${publicId}`;
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl
};