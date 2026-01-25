// Re-export types
export * from './types'

// Import providers to register them
import './ical'
import './mockChannelManager'

// Re-export the registry and factory
export { providerRegistry, getProviderAdapter, registerProvider } from './types'
