const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true,
    enum: ['client', 'lawyer', 'student', 'admin'],
    default: 'client'
  },
  // User status
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Lawyer-specific fields
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_requested'],
    default: 'not_requested'
  },
  specialization: {
    type: String,
    required: function() { return this.role === 'lawyer'; }
  },
  experience: {
    type: Number,
    required: function() { return this.role === 'lawyer'; }
  },
  barCouncilNumber: {
    type: String,
    required: function() { return this.role === 'lawyer'; }
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
   // CLIENT PAYMENT TRACKING (for lawyers to track client payments)
  clientPayment: {
    status: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'refunded'],
      default: 'unpaid'
    },
    agreedAmount: {
      type: Number,
      default: 0
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date
    },
    lastPaymentDate: {
      type: Date
    },
    paymentHistory: [{
      amount: Number,
      date: {
        type: Date,
        default: Date.now
      },
      method: String,
      notes: String
    }]
  },
  documents: {
    // Case-specific document storage
    cases: [{
      caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case'
      },
      caseName: String,
      folders: {
        general: [{
          publicId: String,
          name: String,
          type: String, // 'image', 'pdf', 'document'
          size: Number,
          url: String,
          format: String, // 'jpg', 'pdf', 'docx'
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          description: String,
          folderPath: String // Cloudinary folder path
        }],
        court_documents: [{
          publicId: String,
          name: String,
          type: String,
          size: Number,
          url: String,
          format: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          description: String,
          folderPath: String
        }],
        evidence: [{
          publicId: String,
          name: String,
          type: String,
          size: Number,
          url: String,
          format: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          description: String,
          folderPath: String
        }],
        correspondence: [{
          publicId: String,
          name: String,
          type: String,
          size: Number,
          url: String,
          format: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          description: String,
          folderPath: String
        }],
        contracts: [{
          publicId: String,
          name: String,
          type: String,
          size: Number,
          url: String,
          format: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          description: String,
          folderPath: String
        }]
      }
    }],
    
    // Personal documents (not case-related)
    personal: [{
      publicId: String,
      name: String,
      type: String,
      size: Number,
      url: String,
      format: String,
      category: {
        type: String,
        enum: ['profile', 'verification', 'misc'],
        default: 'misc'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      description: String
    }]
  },

  // Document storage tracking
  storageUsage: {
    totalUsed: {
      type: Number, // in bytes
      default: 0
    },
    caseDocuments: {
      type: Number,
      default: 0
    },
    personalDocuments: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Storage limits based on user role
  storageLimit: {
    type: Number, // in bytes
    default: function() {
      switch(this.role) {
        case 'lawyer': return 5368709120; // 5GB
        case 'client': return 1073741824; // 1GB
        case 'student': return 536870912; // 500MB
        case 'admin': return 10737418240; // 10GB
        default: return 1073741824; // 1GB
      }
    }
  },

  
  // Payment fields
  hasPaid: { 
    type: Boolean, 
    default: false 
  },
  paymentDate: { 
    type: Date 
  },
  razorpayPaymentId: {
    type: String
  },
  razorpayOrderId: {
    type: String
  },
  
  // Admin fields
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
 
  joinTeamStatus: {
    type: String,
    enum: ['not_requested', 'pending', 'approved', 'rejected', 'paid'],
    default: 'not_requested'
  },
  verificationRequestedAt: {
    type: Date
  },
  verificationDeadline: {
    type: Date
  },
  paymentDeadline: {
    type: Date
  },
  teamJoinFee: {
    type: Number,
    default: 2499 
  },
  teamJoinPaymentId: {
    type: String
  },
  profilePicture: { type: String },
  teamJoinPaymentDate: {
    type: Date
  },

  // Session tracking
  sessionDuration: {
    type: Number,
    default: 0 // in minutes
  },
  lastSession: {
    type: Date
  }
}, {
  timestamps: true // ✅ MOVED TO SCHEMA OPTIONS (second parameter)
});




UserSchema.pre('save', function(next) {
  // Admin users are always verified and active
  if (this.role === 'admin') {
    this.isVerified = true;
    this.isActive = true;
    this.hasPaid = true;
    this.verificationStatus = 'approved';
  }

  // ✅ ADD THIS: Initialize documents if not exists
  if (!this.documents) {
    this.documents = {
      cases: [],
      personal: []
    };
  }

  // ✅ ADD THIS: Initialize storage usage if not exists
  if (!this.storageUsage) {
    this.storageUsage = {
      totalUsed: 0,
      caseDocuments: 0,
      personalDocuments: 0,
      lastUpdated: new Date()
    };
  }

  next();
});

// Middleware to handle admin-specific defaults
UserSchema.pre('save', function(next) {
  // Admin users are always verified and active
  if (this.role === 'admin') {
    this.isVerified = true;
    this.isActive = true;
    this.hasPaid = true;
    this.verificationStatus = 'approved';
  }
  next();
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last active timestamp
UserSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};


// Add document to user's case
UserSchema.methods.addCaseDocument = function(caseId, caseName, documentData, folder = 'general') {
  let caseDoc = this.documents.cases.find(c => c.caseId.toString() === caseId.toString());
  
  if (!caseDoc) {
    caseDoc = {
      caseId: caseId,
      caseName: caseName,
      folders: {
        general: [],
        court_documents: [],
        evidence: [],
        correspondence: [],
        contracts: []
      }
    };
    this.documents.cases.push(caseDoc);
  }

  // Add document to the specified folder
  caseDoc.folders[folder].push({
    ...documentData,
    uploadedAt: new Date()
  });

  // Update storage usage
  this.storageUsage.totalUsed += documentData.size;
  this.storageUsage.caseDocuments += documentData.size;
  this.storageUsage.lastUpdated = new Date();

  return this.save();
};

// Remove document from user's case
UserSchema.methods.removeCaseDocument = function(caseId, publicId, folder) {
  const caseDoc = this.documents.cases.find(c => c.caseId.toString() === caseId.toString());
  
  if (caseDoc && caseDoc.folders[folder]) {
    const docIndex = caseDoc.folders[folder].findIndex(doc => doc.publicId === publicId);
    
    if (docIndex > -1) {
      const removedDoc = caseDoc.folders[folder][docIndex];
      
      // Update storage usage
      this.storageUsage.totalUsed -= removedDoc.size;
      this.storageUsage.caseDocuments -= removedDoc.size;
      this.storageUsage.lastUpdated = new Date();
      
      caseDoc.folders[folder].splice(docIndex, 1);
      return this.save();
    }
  }
  
  return Promise.resolve(this);
};

// Get case documents
UserSchema.methods.getCaseDocuments = function(caseId) {
  const caseDoc = this.documents.cases.find(c => c.caseId.toString() === caseId.toString());
  return caseDoc ? caseDoc.folders : null;
};

// Check storage limit
UserSchema.methods.hasStorageSpace = function(fileSize) {
  return (this.storageUsage.totalUsed + fileSize) <= this.storageLimit;
};

// Get storage info
UserSchema.methods.getStorageInfo = function() {
  return {
    used: this.storageUsage.totalUsed,
    limit: this.storageLimit,
    available: this.storageLimit - this.storageUsage.totalUsed,
    usagePercentage: ((this.storageUsage.totalUsed / this.storageLimit) * 100).toFixed(2)
  };
};

module.exports = mongoose.model('User', UserSchema);