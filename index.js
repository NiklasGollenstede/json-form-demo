(function(global) { 'use strict'; define(async ({
	'react': { createElement: e, }, // JSX really isn't necessary for a project of this size, so use `React.createElement`.
	'react-dom': ReactDOM,
	'react-jsonschema-form': { default: Form, },
	'shim!node_modules/yamljs/dist/yaml.min:YAML': YAML, // YAML implementation wit API similar to JSON.
	'fetch!forms.json:json': formsList, // Directory listing over the files in `/forms/`.
	KvStore, // See `./kv-store.js`.
}) => { /* eslint-disable no-console */

/*!
 * Single main entry point to the JS web app.
 */

const store = new KvStore({ name: 'formData', }); // Holds the form data of each form, keyed by the Schema file name.

const selectHost = document.getElementById('main').appendChild(Object.assign(document.createElement('section'), { id: 'selectHost', }));
const formHost   = document.getElementById('main').appendChild(Object.assign(document.createElement('section'), { id: 'formHost', }));
const output     = document.getElementById('main').appendChild(Object.assign(document.createElement('section'), { id: 'output', }));

// render a form with a single `<select>` over the `formsList`, and `onChange` `showForm` of that Schema file
selectHost.client = ReactDOM.render(e(Form, {
	className: 'was-validated', // UI `:(in)?valid` state is only rendered once this is set, so just set it from the start
	schema: { // a top level string/enum in the Schema should work, but wasn't form-validated correctly
		title: 'Select form', type: 'object', required: [ 'name', ],
		properties: { name: { type: 'string', enum: formsList, /* default: formsList.slice(-2)[0], */ }, },
	},
	onChange({ formData: { name, } = { }, }) {
		if (!formsList.includes(name)) { return; }
		showForm(name).catch(console.error);
		store.set(':select', { name, }); // save the selected form, with a name that can't collide with a file name
	},
}, [ /* empty to suppress the 'Submit' button */ ]), selectHost);

// select the form saved from last time (setting this in the ctor didn't work)
selectHost.client.setState({ formData: (await store.get(':select').catch(() => null)), });
(await showForm(selectHost.client.state.formData.name));

/**
 * Renders a form from its Schema file and with the stored `formData` (if any).
 * @param {string} name Name of the `*.json` or `*.yaml` file in `/forms/`.
 */
async function showForm(name) {
	// load the JSON or YAML file
	const { schema, uiSchema, } = ({ YAML, JSON, })[name.split('.').pop().toUpperCase()]
	.parse((await require.async(`fetch!forms/${name}`)));
	console.log('showForm', name, { schema, uiSchema, });

	// replace the previous form
	formHost.dataset.formName = name;
	ReactDOM.unmountComponentAtNode(formHost);
	formHost.client = ReactDOM.render(e(Form, {
		className: 'was-validated', liveValidate: true, schema, uiSchema,
		formData: (await store.get(name).catch(() => null)), // load the previously saved `formData`
		onSubmit, onError, onChange,
	}, [
		e('button', { type: 'submit', key: 'submit', className: 'btn btn-info', }, [ 'Submit', ]), // the default submit button
		e('input', { type: 'reset', key: 'reset', className: 'btn', value: 'Reset', onClick() { // button to clear the form
			formHost.client.setState({ formData: null, });
			showOutput(null); store.delete(formHost.dataset.formName); // also clear the output and stored value
		}, }),
	]), formHost);
	showOutput(formHost.client.state.formData); // the ctor doesn't (always?)  trigger `onSubmit`, so set the initial output manually
}

function onSubmit(event) {
	console.log('onSubmit', event);
}
function onError(event) {
	console.log('onError', event);
}
async function onChange(event) {
	console.log('onChange', event);
	(await null); // sometimes this was called synchronously from the ctor, meaning the `formHost.client` instance wasn't returned and assigned yet
	showOutput(formHost.client.state.formData);
	store.set(formHost.dataset.formName, formHost.client.state.formData);
}
function showOutput(data) {
	const divs = YAML.stringify(data).split('\n')
	.map(line => Object.assign(document.createElement('div'), { textContent: line, }));
	output.textContent = ''; output.append(...divs);
}

// debugger;

console.log('loaded');

}); global.require.config({ errback(error) {
	// executed when any of the currently loading modules (including their dependencies and this module) fail to load
	console.log('Page failed to load!:', error); // should do some actual error handling here
}, }); })(this);
