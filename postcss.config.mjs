import path from "path"

const config = {
  plugins: {
    "postcss-flexbugs-fixes": {},
    "@csstools/postcss-global-data": {
      files: [path.resolve(process.cwd(), "src/styles/custom-media.css")],
    },
    "postcss-preset-env": {
      stage: 3,
      browsers: ["defaults"],
      autoprefixer: { flexbox: "no-2009" },
      features: {
        "nesting-rules": true,
        "custom-media-queries": true,
        "custom-properties": false,
      },
    },
    "postcss-normalize": { browsers: "defaults" },
  },
}

export default config
