import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: 'dzewb6t64', 
    api_key: '832381689355839', 
    api_secret: 'JZbls_2MQ4mpGnXVTVPwS1wGkrU'
});

const uploadOnCloudinary = async (localFilePath) => {
    console.log("Entering uploadOnCloudinary function...");

    try {
        console.log("Entering uploadOnCloudinary try......");

        if (!fs.existsSync(localFilePath)) {
            console.error('File does not exist at path:', localFilePath);
            return null;
        }
        
        //upload a file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",   // Detect file type
            folder: "comments", // Organize uploads in a folder
            transformation: [
                { quality: "auto:good" }, // Optimize quality
                { fetch_format: "auto" }  // Auto format selection
            ]
        });

        // file has uploaded successfully
        fs.unlinkSync(localFilePath);
        console.log("Local temp file removed");

        return response;
    } catch(error) {
        console.error("Error uploading to Cloudinary:", error);
        
        // Remove the locally saved temp file as the upload failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Image deleted from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }; 