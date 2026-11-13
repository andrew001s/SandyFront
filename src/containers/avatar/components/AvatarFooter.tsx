export default function AvatarFooter({
	isHudVisible,
	isFullscreen,
}: { isHudVisible: boolean; isFullscreen: boolean }) {
	if (!isHudVisible || isFullscreen) return null;

	return (
		<p className='pointer-events-none absolute bottom-3 left-3 hidden max-w-[calc(100%-7rem)] rounded-md bg-background/75 px-2 py-1 text-[10px] text-muted-foreground md:block'>
			Arrastra para ajustar la vista · Rueda para acercar
		</p>
	);
}
