// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  // Replace with your actual cloud name from dashboard
  cloudName: 'dwua2kvwe', 
  
  // Replace with the upload preset name you created
  uploadPreset: 'legalmitra_documents',
  
  // Your API key from dashboard (safe to use in frontend)
  apiKey: '954184951645266'
};

// Settings for document uploads
export const DOCUMENT_SETTINGS = {
  maxFileSize: 50 * 1024 * 1024, // 50MB max file size
  allowedFormats: [
    'pdf', 'doc', 'docx', 'txt', 'rtf', 
    'jpg', 'jpeg', 'png', 'gif',
    'mp4', 'mov', 'avi',
    'mp3', 'wav',
    'zip', 'rar'
  ]
};