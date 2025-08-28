import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: 'dzewb6t64', 
    api_key: '832381689355839', 
    api_secret: 'JZbls_2MQ4mpGnXVTVPwS1wGkrU'
});

const uploadLogoToCloudinary = async (localFilePath) => {
    console.log("Entering uploadLogoToCloudinary function...");

    try {
        console.log("Uploading logo to Cloudinary...");

        if (!fs.existsSync(localFilePath)) {
            console.error('Logo file does not exist at path:', localFilePath);
            return null;
        }
        
        // Upload logo to Cloudinary in company-logos folder
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",   // Detect file type
            folder: "company-logos", // Organize logos in a separate folder
            transformation: [
                { quality: "auto:good" }, // Optimize quality
                { fetch_format: "auto" }  // Auto format selection
            ]
        });

        // File has uploaded successfully, remove local temp file
        fs.unlinkSync(localFilePath);
        console.log("Local logo temp file removed");

        return response;
    } catch(error) {
        console.error("Error uploading logo to Cloudinary:", error);
        
        // Remove the locally saved temp file as the upload failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Function to delete logo from Cloudinary
const deleteLogoFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Logo deleted from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Error deleting logo from Cloudinary:", error);
        return null;
    }
};

export { uploadLogoToCloudinary, deleteLogoFromCloudinary };
