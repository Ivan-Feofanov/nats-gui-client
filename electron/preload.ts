import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
	connectNATS: (server: string) => ipcRenderer.invoke('connect-nats', server),
	disconnectNATS: () => ipcRenderer.invoke('disconnect-nats'),
	getHistory: () => ipcRenderer.invoke('get-history'),
	getData: (endpoint: string, request: Object | null) =>
		ipcRenderer.invoke('get-data', endpoint, request)
})
