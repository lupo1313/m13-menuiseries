// Couleurs M13 pour tout le Studio (API officielle buildLegacyTheme) : bleu profond, crème, bronze.
import {buildLegacyTheme} from 'sanity'

const navy = '#13304b'
const bronze = '#a8794b'

export const m13Theme = buildLegacyTheme({
  '--black': '#15283a',
  '--white': '#fbf8f3',
  '--gray': '#5f6b75',
  '--gray-base': '#5f6b75',
  '--component-bg': '#fbf8f3',
  '--component-text-color': '#15283a',
  '--brand-primary': bronze,
  '--default-button-color': '#5f6b75',
  '--default-button-primary-color': bronze,
  '--default-button-success-color': '#2f7a4f',
  '--default-button-warning-color': '#c47d1d',
  '--default-button-danger-color': '#b83a2e',
  '--state-info-color': '#1d3f5f',
  '--state-success-color': '#2f7a4f',
  '--state-warning-color': '#c47d1d',
  '--state-danger-color': '#b83a2e',
  '--main-navigation-color': navy,
  '--main-navigation-color--inverted': '#ffffff',
  '--focus-color': bronze,
})
