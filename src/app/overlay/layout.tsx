export default function OverlayLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className='fixed inset-0 m-0 h-screen w-screen overflow-hidden bg-transparent p-0'>
			{children}
		</div>
	);
}
