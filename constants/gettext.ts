/**
 * Constants for gettext functions
 */

// Standard gettext function names
export const GETTEXT_FUNCTIONS = [
  // Standard gettext functions
  'gettext',
  '_',
  // Context-specific gettext functions
  'pgettext',
  // Plural forms
  'ngettext',
  // Context-specific plural forms
  'npgettext',
  // Domain-specific functions
  'dgettext',
  'dngettext',
  'dpgettext',
  'dnpgettext',
]

// Vue3-gettext style function names with $ prefix
export const VUE_GETTEXT_FUNCTIONS = GETTEXT_FUNCTIONS.map(fn => `$${fn}`)

// WordPress style function names
export const WP_GETTEXT_FUNCTIONS = [
  '__', // gettext
  '_x', // pgettext
  '_n', // ngettext
  '_nx', // npgettext
]

// All supported gettext function names
export const ALL_GETTEXT_FUNCTIONS = [
  ...GETTEXT_FUNCTIONS,
  ...VUE_GETTEXT_FUNCTIONS,
  ...WP_GETTEXT_FUNCTIONS,
]

// Regular expression for standard gettext function calls
// Example: gettext("Hello World")
export const GETTEXT_FUNCTION_REGEX = new RegExp(
  `\\b(${ALL_GETTEXT_FUNCTIONS.join('|')})\\s*\\(\\s*(['"\`])(.+?)\\2`,
  'g',
)

// Regular expression for template syntax with gettext functions
// Example: {{ $gettext("Hello World") }}
export const TEMPLATE_GETTEXT_REGEX = new RegExp(
  `\\{\\{\\s*(${VUE_GETTEXT_FUNCTIONS.join('|')})\\s*\\(\\s*(['"\`])(.+?)\\2(?:\\s*,\\s*(['"\`])(.+?)\\4)?\\s*\\)\\s*\\}\\}`,
  'g',
)

// Regular expression for pgettext-style functions (with context)
// Example: pgettext("context", "text")
export const PGETTEXT_FUNCTION_REGEX = new RegExp(
  `\\b(pgettext|\\$pgettext|_x|npgettext|\\$npgettext|_nx|dpgettext|\\$dpgettext|dnpgettext|\\$dnpgettext)\\s*\\(\\s*(['"\`])(.+?)\\2\\s*,\\s*(['"\`])(.+?)\\4`,
  'g',
)
