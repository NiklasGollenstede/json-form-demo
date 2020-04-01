
# JSON Schema Form example

A simple example app showing the power of JSON Schema in combination with [`react-jsonschema-form`](https://react-jsonschema-form.readthedocs.io/en/latest/), which I wrote as an exercise to get to know JSON Schema.
It displays the forms rendered from the JSON Schema in the YAML files in `forms/`.

## Usage

It's a NPM package, so `node` wit `npm` must be available, then `npm install` (or `npm ci` for a faster install), will install the specific dependencies, and `npm start` will start a static HTTP server.
Now, visit the website at <http://localhost:3000/> and be amazed by the forms and the simplicity of the Schema they are rendered from.

The Schema files in `forms/` can be freely added, as long as they have a top level `schema` property that specifies valid JSON Schema (that `react-jsonschema-form` is capable of rendering), plus an optional `uiSchema` property.
If the list of files in `forms/` was changed, run `npm run dir` to have it updated on the next reload of the app.
