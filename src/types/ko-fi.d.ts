interface Window {
	kofiwidget2?: {
		init: (text: string, color: string, id: string) => void;
		getHTML: () => string;
		draw: () => void;
	};
	kofiWidgetOverlay?: {
		draw: (id: string, options: Record<string, string>, containerId?: string) => void;
	};
}
