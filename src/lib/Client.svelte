<script lang="ts">
	import Button, { Group, Label } from '@smui/button'
	import CircularProgress from '@smui/circular-progress'
	import LayoutGrid, { Cell } from '@smui/layout-grid'
	import Select, { Option } from '@smui/select'
	import Textfield from '@smui/textfield'
	import HelperText from '@smui/textfield/helper-text'
	import { onMount } from 'svelte'
	import { JSONEditor } from 'svelte-jsoneditor'

	type Request = {
		id: number
		host: string
		endpoint: string
		payload: Object
	}

	let req: Request | undefined
	let _req: Request | undefined = {
		host: 'localhost:4222',
		endpoint: 'get-data',
		payload: { field: 'value' }
	}

	let _historyID: number | undefined = undefined

	let data: string = ''
	let connected: boolean = false
	let loading: boolean = false
	let reqHistory: Request[] = []

	let content = { json: {} }

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

	async function getHistory() {
		let res = await window.electronAPI.getHistory()
		reqHistory = res.map((item, index) => {
			return { ...item, id: index }
		})
	}

	onMount(async () => {
		await getHistory()
	})

	async function connect() {
		try {
			loading = true
			state.connection.error = false
			await window.electronAPI.connectNATS(_req.host)
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
		try {
			loading = true
			state.loadingData.error = false
			let data: Object | null = content.json
				? content.json
				: content.text
				? JSON.parse(content.text)
				: null
			let json = await window.electronAPI.getData(_req.endpoint, data)
			data = JSON.stringify(json, null, 2)
			loading = false
		} catch (err) {
			loading = false
			state.loadingData.error = true
			state.loadingData.message = err
		}
		await getHistory()
	}

	$: {
		if (req && req.id !== _historyID) {
			content = { json: req ? req.payload : {} }
			_historyID = req.id
		}
	}
	$: {
		if (!req) {
			break $
		}
		if (req) _req = req
	}
</script>

<main>
	<LayoutGrid>
		<Cell span={12}>
			<div>
				<Select
					key={(item) => `${item ? item.id : ''}`}
					bind:value={req}
					label="Requests history"
					style="width:100%"
				>
					{#each reqHistory as item (item.id)}
						<Option value={item}>{item.host}/{item.endpoint}</Option>
					{/each}
				</Select>
			</div>
		</Cell>
		<Cell span={12}>
			<Textfield
				type="text"
				bind:disabled={connected}
				style="width: 100%;"
				helperLine$style="width: 100%;"
				bind:invalid={state.connection.error}
				bind:value={_req.host}
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
				bind:value={_req.endpoint}
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
					disabled={!(connected && _req.endpoint)}
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
