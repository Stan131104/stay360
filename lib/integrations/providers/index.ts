// Re-export types
export * from './types'

// Import providers to register them
import './ical'
import './mockChannelManager'
import './airbnb-api'
import './booking-api'

// Re-export the registry and factory
export { providerRegistry, getProviderAdapter, registerProvider, isApiProvider } from './types'
