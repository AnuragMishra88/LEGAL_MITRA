// src/config/pricing.js
export const PRICING = {
  LAWYER: {
    PERSONAL: {
      name: "Lawyer Personal Space",
      price: 1799,
      description: "Access to personal case management tools only",
      features: [
        "Personal case management",
        "Basic client communication",
        "Case status tracking", 
        "Document storage",
        "Up to 20 active cases",
        "Basic analytics",
        "Email support"
      ]
    },
    TEAM_UPGRADE: {
      name: "Team Membership Upgrade",
      price: 700, // Difference amount
      description: "Upgrade from personal to team membership",
      features: [
        "All personal features",
        "Verified profile badge",
        "Featured in team listing",
        "Advanced analytics",
        "Priority support"
      ]
    },
    TEAM: {
      name: "Complete Team Membership",
      price: 2499, 
      description: "Full access to LegalMitra lawyer network and team features",
      features: [
        "Verified profile badge",
        "Featured in lawyer directory",
        "Team collaboration tools",
        "Priority client referrals",
        "Unlimited cases",
        "Advanced analytics",
        "Professional network access",
        "Priority support",
        "Client portal access",
        "Performance insights"
      ]
    }
  },
  
  CLIENT: {
    BASIC: {
      name: "Client Case Management",
      price: 1799,
      description: "Complete access to track and manage your legal cases",
      features: [
        "Unlimited case tracking",
        "Direct lawyer communication",
        "Case progress updates",
        "Document storage",
        "Legal expense calculator",
        "Priority support",
        "Case status notifications",
        "Lawyer matching service",
        "Hearing date reminders"
      ]
    }
  },
  
  TEAM_JOIN: {
    price: 2499,
    name: "Team Joining Fee", 
    description: "One-time fee to join LegalMitra lawyer network with full team benefits",
    features: [
      "Verified profile badge",
      "Featured in lawyer directory",
      "Team collaboration tools",
      "Priority client referrals",
      "Unlimited cases",
      "Advanced analytics",
      "Professional network access",
      "Priority support",
      "Client portal access",
      "Performance insights"
    ]
  }
};

export default PRICING;