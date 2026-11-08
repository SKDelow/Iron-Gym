/**
 * IRON GYM / FORGED — OWNER CONFIGURATION
 * Replace all demonstration fields before publishing a real gym website.
 * Demo membership prices are illustrative, not offers.
 * A real booking, pass capture, and live occupancy API must be connected.
 */
window.IRON_CONFIG = {
  name: 'IRON GYM',
  city: 'CITY',
  state: 'STATE',
  streetAddress: '', // Example: '123 Training Way' — blank until confirmed
  postalCode: '',
  phone: '',
  email: '',
  websiteUrl: '', // Production URL, e.g. 'https://example.com'
  privacyPolicyUrl: '', // REQUIRED before enabling live form submission
  liveFormsEnabled: false, // Fail closed until backend and policy are ready
  timezone: 'America/Boise',
  openingHoursDisplay: 'HOURS TO BE CONFIRMED',
  socialLinks: { instagram: '', facebook: '', tiktok: '' },
  capacities: { total: 100 }, // SIMULATED maximum floor capacity
  pricing: {
    open: { name: 'OPEN GYM', monthly: 49, description: 'Independent training, your way.' },
    performance: { name: 'PERFORMANCE', monthly: 89, description: 'Train solo. Go further together.' },
    coaching: { name: 'COACHING+', monthly: 149, description: 'More guidance. Better direction.' }
  },
  // Annual demonstration billing is 10 × monthly price (2 months free).
  annualMonthsCharged: 10,
  integrations: {
    // Implement: return { percent: number 0–100, people?: number, timestamp?: string }.
    occupancyEndpoint: '',
    // Implement your secure server endpoint; NEVER insert private API keys in browser JS.
    freePassEndpoint: '',
    bookingProviderUrl: ''
  }
};
