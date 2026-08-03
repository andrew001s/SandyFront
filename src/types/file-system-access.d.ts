declare global {
	interface Window {
		showDirectoryPicker(options?: {
			id?: string;
			mode?: 'read' | 'readwrite';
		}): Promise<FileSystemDirectoryHandle>;
	}

	interface FileSystemDirectoryHandle {
		entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
		queryPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
		requestPermission(options?: {
			mode?: 'read' | 'readwrite';
		}): Promise<PermissionState>;
	}
}

export {};
