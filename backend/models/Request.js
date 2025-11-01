const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  caseSummary: {
    type: String,
    required: true
  },
  caseType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending'
  },
  lawyerResponse: {
    type: String
  },
  responseDate: {
    type: Date
  },
  contactInfo: {
    email: String,
    phone: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', RequestSchema);