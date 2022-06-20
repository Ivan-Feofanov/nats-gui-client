<script lang="ts">
	import { JSONEditor } from 'svelte-jsoneditor'
	import LayoutGrid, { Cell } from '@smui/layout-grid'
	import Textfield from '@smui/textfield'
	import Button, { Group, Label } from '@smui/button'
	import HelperText from '@smui/textfield/helper-text'
	import CircularProgress from '@smui/circular-progress'

	let data = ''
	let connected = false
	let loading = false
	let server = 'localhost:4222'
	let endpoint = 'user.findCertifiedTutors'

	let content = {
		text: '',
		json: undefined
	}

	let state = {
		connection: {
			error: false,
			message: null
		},
		loadingData: {
			error: false,
			message: null
		}
	}

	async function connect() {
		try {
			loading = true
			state.connection.error = false
			await window.electronAPI.connectNATS(server)
			connected = true
			loading = false
		} catch (err) {
			loading = false
			state.connection = {
				error: true,
				message: err
			}
		}
	}

	async function disconnect() {
		try {
			state.connection.error = false
			await window.electronAPI.disconnectNATS(server)
			connected = false
		} catch (err) {
			state.connection = {
				error: true,
				message: err
			}
		}
	}

	async function getData() {
		data = ''
		try {
			loading = true
			state.loadingData.error = false
			let request: Object | null = content.json
				? content.json
				: content.text
				? JSON.parse(content.text)
				: null
			let json = await window.electronAPI.getData(endpoint, request)
			data = JSON.stringify(json, null, 2)
			loading = false
		} catch (err) {
			loading = false
			state.loadingData.error = true
			state.loadingData.message = err
		}
	}
</script>

<main>
	<LayoutGrid>
		<Cell span={12}>
			<Textfield
				type="text"
				bind:disabled={connected}
				style="width: 100%;"
				helperLine$style="width: 100%;"
				bind:invalid={state.connection.error}
				bind:value={server}
				prefix="nats://"
				label="NATS Server:"
			>
				<HelperText validationMsg slot="helper">
					{state.connection.message}
				</HelperText>
			</Textfield>
		</Cell>
		<Cell span={12}>
			<Group
				variant="unelevated"
				style="display: flex; justify-content: stretch; margin-top: -14px"
			>
				{#if !connected}
					<Button on:click={connect} variant="raised" style="flex-grow: 1;">
						<Label>Connect</Label>
					</Button>
				{:else}
					<Button
						on:click={disconnect}
						variant="raised"
						color="secondary"
						style="flex-grow: 1;"
					>
						<Label>Disconnect</Label>
					</Button>
				{/if}
			</Group>
		</Cell>
		<Cell span={12}>
			<Textfield
				type="text"
				disabled={!connected}
				style="width: 100%;"
				helperLine$style="width: 100%;"
				bind:invalid={state.loadingData.error}
				bind:value={endpoint}
				label="NATS Endpoint:"
			>
				<HelperText validationMsg slot="helper">
					{state.loadingData.message}
				</HelperText>
			</Textfield>
		</Cell>
		<Cell span={12}>Request body:</Cell>
		<Cell span={12}>
			<JSONEditor
				bind:content
				mode="code"
				mainMenuBar={false}
				navigationBar={false}
			/>
		</Cell>
		<Cell span={12}>
			<Group
				variant="unelevated"
				style="display: flex; justify-content: stretch; margin-top: -12px"
			>
				<Button
					on:click={getData}
					variant="raised"
					style="flex-grow: 1;"
					disabled={!connected}
				>
					<Label>Send</Label>
				</Button>
			</Group>
		</Cell>
		<Cell span={12}>
			<pre>{data}</pre>
		</Cell>
	</LayoutGrid>
	{#if loading}
		<div style="display: flex; justify-content: center">
			<CircularProgress
				class="my-four-colors"
				style="height: 32px; width: 32px;"
				indeterminate
				fourColor
			/>
		</div>
	{/if}
</main>

<style>
</style>
