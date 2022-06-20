import App from './App.svelte'
declare global {
	interface Window {
		electronAPI: any
	}
}
const app = new App({
	target: document.getElementById('app')
})

export default app
