import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'ledger',
    themes: {
      ledger: {
        dark: false,
        colors: {
          primary: '#0f766e',
          secondary: '#334155',
          surface: '#ffffff',
          background: '#f4f7f5',
          error: '#dc2626',
          success: '#15803d',
        },
      },
    },
  },
})
