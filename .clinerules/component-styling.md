## Brief overview

This set of guidelines outlines the preferred approach for creating and styling components in the project. It focuses on component organization, CSS modules usage, spacing conventions, and layout preferences.

## Component organization

- Place components in a local `_components` folder within the feature directory they belong to
- Keep components close to where they are used, following a local-first approach
- Use index.tsx for component implementation and style.module.css for styling
- Use kebab-case for all file and directory names (e.g., `product-card`, `user-profile`)

## CSS styling approach

- Use CSS Modules with the naming convention `style.module.css` for component styling
- Import styles with a short alias, preferably `s` (e.g., `import s from './style.module.css'`)
- Use the `composes` feature when needed to inherit global styles
- Use global typography classes for heading or text-related elements when not consuming global Heading or Text components

### Use our global color vars

Read: src/styles/colors.css for the full list of available color variables.

### Use our global typography classes when not consuming global Heading or Text components

src/styles/fonts.css contains these classes.

### Use mobile-first styles

- Leverage custom media vars within nested blocks

```css
.myClass {
  padding: 16px;

  @media (--viewport-medium-up) {
    padding: 24px;
  }
}
```

These are as follows:

```css
@custom-media --viewport-xx-small (max-width: 320px);
@custom-media --viewport-x-small (max-width: 374px);
@custom-media --viewport-small (max-width: 500px);
@custom-media --viewport-small-up (min-width: 500px);
@custom-media --viewport-medium-small (max-width: 768px);
@custom-media --viewport-medium (min-width: 768px) and (max-width: 1024px);
@custom-media --viewport-medium-up (min-width: 768px);
@custom-media --viewport-large (min-width: 1024px);
@custom-media --viewport-x-large (min-width: 1200px);
@custom-media --viewport-xx-large (min-width: 1400px);
@custom-media --viewport-wide-screen (min-width: 1700px);
```

## Spacing and measurements

- Use pixel (px) values that are divisible by 4 (e.g., 4px, 8px, 12px, 16px, 24px, 32px, 40px)
- For finer adjustments, use values that are multiples of 8 (e.g., 4px, 12px, 20px)
- Maintain consistent spacing throughout the application by adhering to this 8px grid system

## Layout preferences

- Prefer CSS Grid and Flexbox for layouts
- Use the `gap` property for spacing between grid/flex items rather than margins
- Set explicit `gap` values that follow the 8px grid system (e.g., 8px, 16px, 24px)
- For responsive designs, use media queries to adjust grid templates and gap values

## Element spacing

- Use padding for spacing elements, not margin
- Set margin to 0 on elements that have default margin
- Apply padding that follows the 8px grid system
- For container elements, use consistent padding values (e.g., padding: 24px)
