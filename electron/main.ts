import * as path from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { connect, Empty, NatsConnection } from 'nats'
import { decode, encode } from '@msgpack/msgpack'

const isDev = process.env.IS_DEV == 'true' ? true : false

let nc: NatsConnection | null = null

async function disconnectNATS() {
	if (nc !== null && !nc.isClosed()) {
		console.log(`disconnecting from: ${nc.info?.host}:${nc.info?.port}`)
		await nc.close()
		nc = null
	}
}

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true
		}
	})

	// and load the index.html of the app.
	// win.loadFile("index.html");
	mainWindow.loadURL(
		isDev
			? 'http://localhost:3000'
			: `file://${path.join(__dirname, '../dist/index.html')}`
	)
	// Open the DevTools.
	if (isDev) {
		mainWindow.webContents.openDevTools()
	}

	// IPCs
	ipcMain.removeHandler('get-data')
	ipcMain.handle(
		'get-data',
		async (_, endpoint: string, request: Object | null): Promise<unknown> => {
			console.log(`getting data from: ${endpoint}`)
			try {
				if (nc === null || nc.isClosed()) {
					throw Error('Connect to NATS server first')
				}
				const data = request ? encode([request]) : Empty
				const response = await nc.request(endpoint, data, {
					timeout: 100000
				})
				return decode(response.data)
			} catch (err) {
				throw err
			}
		}
	)

	ipcMain.removeHandler('connect-nats')
	ipcMain.handle('connect-nats', async (_, server: string) => {
		console.log(`connecting to: ${server}`)
		await disconnectNATS()
		try {
			nc = await connect({ servers: server })
		} catch (err) {
			throw err
		}
	})

	ipcMain.removeHandler('disconnect-nats')
	ipcMain.handle('disconnect-nats', async (_) => {
		return await disconnectNATS()
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow()
	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
	console.log('Going out')
	if (nc) {
		await disconnectNATS()
		console.log('Disconnected')
	}
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
