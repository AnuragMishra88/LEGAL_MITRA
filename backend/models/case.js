const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  // Case Information
  caseName: { type: String, required: true },
  caseType: { type: String, required: true },
  caseNumber: { type: String },
  courtName: { type: String },
  filingDate: { type: Date },
  nextHearing: { type: Date },
  caseDescription: { type: String },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['ongoing', 'solved', 'pending'], 
    default: 'ongoing' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  
  // Lawyer fields (for both lawyer and client created cases)
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lawyerName: { type: String },
  lawyerEmail: { type: String },
  lawyerPhone: { type: String },
  
  // Client fields (for both lawyer and client created cases)
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName: { type: String },
  clientEmail: { type: String },
  clientPhone: { type: String },
  clientAddress: { type: String },
  
  // Payment fields
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  paymentAmount: { 
    type: Number, 
    default: 1799 
  },
  paymentId: { 
    type: String, 
    default: null 
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  
  // Client Payment Tracking (for lawyers to track client payments)
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
  
  // Additional case fields
  notes: { type: String, default: '' },
  caseValue: { type: String },
  opponentName: { type: String },
  opponentLawyer: { type: String },
  documents: [{ type: String }]

}, {
  timestamps: true
});

// Indexes for better performance
CaseSchema.index({ lawyer: 1, createdAt: -1 });
CaseSchema.index({ client: 1, createdAt: -1 });
CaseSchema.index({ status: 1 });
CaseSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Case', CaseSchema);