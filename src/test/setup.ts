import "@testing-library/jest-dom"

// jsdom doesn't implement scrollIntoView; Radix UI (e.g. Select) calls it
// when opening a list. Polyfill it so those components work in tests.
Element.prototype.scrollIntoView = () => {}
