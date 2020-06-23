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
const main = document.getElementById('main');

const themesList = [ 'cyborg', 'cerulean', 'lumen', 'paper', 'sandstone', 'slate', 'superhero', 'yeti', 'cosmo', 'darkly', 'flatly', 'journal', 'readable', 'simplex', 'spacelab', 'united', '<none>', ];
const themeSelect = renderSelect({
	title: 'Select Theme', items: themesList,
	host: main.appendChild(Object.assign(document.createElement('section'), { id: 'themeSelectHost', })),
	onChange(name) {
		if (!themesList.includes(name)) { return; }
		document.head.querySelector('#theme-link').href = `node_modules/bootswatch/${name}/bootstrap.css`;
		store.set(':select-theme', name); // save the selected theme, with a name that can't collide with a file name
	},
});
store.get(':select-theme').then(name => {
	themeSelect.setState({ formData: {value: name, }, });
	document.head.querySelector('#theme-link').href = `node_modules/bootswatch/${name}/bootstrap.css`;
});

const formSelect = renderSelect({
	title: 'Select Form', items: formsList,
	host: main.appendChild(Object.assign(document.createElement('section'), { id: 'formSelectHost', })),
	onChange(name) {
		if (!formsList.includes(name)) { return; }
		showForm(name).catch(console.error);
		store.set(':select-form', name); // save the selected form, with a name that can't collide with a file name
	},
});

const formHost   = main.appendChild(Object.assign(document.createElement('section'), { id: 'formHost', }));
const output     = main.appendChild(Object.assign(document.createElement('section'), { id: 'output', }));

// select the form saved from last time (setting this in the ctor didn't work)
formSelect.setState({ formData: { value: (await store.get(':select-form').catch(() => null)), }, });
(await showForm(formSelect.state.formData.value));


/// Renders a form with a single `<select>` over the `items` in the `host` element.
function renderSelect({ title, items, host, onChange, }) {
	return (host.client = ReactDOM.render(e(Form, {
		className: 'was-validated', // UI `:(in)?valid` state is only rendered once this is set, so just set it from the start
		schema: { // a top level string/enum in the Schema should work, but wasn't form-validated correctly
			title, type: 'object', required: [ 'value', ],
			properties: { value: { type: 'string', enum: items, }, },
		}, onChange({ formData: { value, } = { }, }) { return onChange.call(this, value); },
	}, [ /* empty to suppress the 'Submit' button */ ]), host));
}

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
			store.delete(formHost.dataset.formName); // clear the stored value
			showForm(name); // re-render the form (setting the value to undefined/null does not work)
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
