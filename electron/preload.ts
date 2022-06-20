import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
	connectNATS: (server: string) => ipcRenderer.invoke('connect-nats', server),
	disconnectNATS: () => ipcRenderer.invoke('disconnect-nats'),
	getData: (endpoint: string, request: Object | null) =>
		ipcRenderer.invoke('get-data', endpoint, request)
})
