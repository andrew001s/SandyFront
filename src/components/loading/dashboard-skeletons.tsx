import { Skeleton } from '@/components/ui/skeleton';

function HeaderSkeleton() {
	return (
		<div className='mb-8 space-y-3'>
			<Skeleton className='h-10 w-56 rounded-2xl' />
			<Skeleton className='h-5 w-full max-w-xl rounded-xl' />
		</div>
	);
}

function CardSkeleton({ className = '' }: { className?: string }) {
	return <Skeleton className={`min-h-52 rounded-2xl border border-border/60 bg-card/70 ${className}`} />;
}

export function HomeSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />

			<div className='my-4 flex items-center gap-4'>
				<Skeleton className='h-px flex-1' />
				<Skeleton className='h-4 w-24 rounded-full' />
				<Skeleton className='h-px flex-1' />
			</div>

			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
				<CardSkeleton />
				<CardSkeleton />
			</div>

			<div className='mt-4 grid gap-4 lg:grid-cols-2'>
				<CardSkeleton className='min-h-80' />
				<CardSkeleton className='min-h-80' />
			</div>

			<div className='my-4 flex items-center gap-4'>
				<Skeleton className='h-px flex-1' />
				<Skeleton className='h-4 w-24 rounded-full' />
				<Skeleton className='h-px flex-1' />
			</div>

			<CardSkeleton className='min-h-96' />
		</div>
	);
}

export function ServiceStartSkeleton() {
	return (
		<div className='group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-background/60 p-5 text-center'>
			<Skeleton className='absolute top-3 right-3 h-5 w-20 rounded-full' />
			<Skeleton className='mt-5 size-12 rounded-2xl' />
			<div className='relative z-10 w-full space-y-3'>
				<Skeleton className='mx-auto h-4 w-36 rounded-full' />
				<Skeleton className='mx-auto h-3 w-44 rounded-full' />
				<Skeleton className='mx-auto mt-4 h-4 w-28 rounded-full' />
			</div>
		</div>
	);
}

export function FeatureFlagsSkeleton() {
	return (
		<div className='rounded-2xl border border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl'>
			<div className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex min-w-0 items-start gap-4'>
						<Skeleton className='size-11 rounded-2xl' />
						<div className='space-y-2'>
							<Skeleton className='h-5 w-48 rounded-full' />
							<Skeleton className='h-4 w-72 rounded-full' />
						</div>
					</div>
					<Skeleton className='h-10 w-32 rounded-xl' />
				</div>
			</div>
			<div className='grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6'>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={`feature-skeleton-${index}`}
						className='relative flex min-h-44 flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-background/60 p-5'
					>
						<Skeleton className='absolute top-3 right-3 h-5 w-20 rounded-full' />
						<Skeleton className='mt-5 size-12 rounded-2xl' />
						<div className='relative z-10 w-full space-y-2 text-center'>
							<Skeleton className='mx-auto h-4 w-28 rounded-full' />
							<Skeleton className='mx-auto h-3 w-32 rounded-full' />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function ConnectionCardSkeleton() {
	return (
		<div className='relative overflow-hidden rounded-[22px] bg-background p-2'>
			<div className='mt-3 w-full rounded-[20px] border border-border/60 bg-card/60 p-0.5 sm:p-0'>
				<div className='flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:space-x-4'>
					<div className='flex flex-row items-center space-x-4 sm:justify-center'>
						<Skeleton className='ml-4 size-28 rounded-full' />
						<div className='space-y-3'>
							<Skeleton className='h-7 w-36 rounded-full' />
							<Skeleton className='h-4 w-28 rounded-full' />
						</div>
					</div>

					<div className='flex w-full flex-col justify-center space-y-4'>
						<Skeleton className='h-16 w-full rounded-2xl' />
						<Skeleton className='h-6 w-48 rounded-full' />
					</div>
				</div>
			</div>
			<Skeleton className='-right-3 -top-10 absolute size-16 rounded-full opacity-80' />
		</div>
	);
}

export function LandingSkeleton() {
	return (
		<div className='min-h-screen bg-[#F6F3FC] px-4 py-8 dark:bg-[#0B0A12]'>
			<div className='mx-auto flex w-full max-w-6xl flex-col gap-8'>
				<div className='flex items-center justify-between'>
					<Skeleton className='h-10 w-40 rounded-2xl' />
					<Skeleton className='h-10 w-28 rounded-full' />
				</div>
				<div className='space-y-4 rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-sm'>
					<Skeleton className='h-12 w-full max-w-3xl rounded-2xl' />
					<Skeleton className='h-6 w-full max-w-2xl rounded-full' />
					<div className='grid gap-4 md:grid-cols-2'>
						<CardSkeleton className='min-h-72' />
						<CardSkeleton className='min-h-72' />
					</div>
				</div>
				<div className='grid gap-4 md:grid-cols-3'>
					<CardSkeleton className='min-h-40' />
					<CardSkeleton className='min-h-40' />
					<CardSkeleton className='min-h-40' />
				</div>
			</div>
		</div>
	);
}

export function ConnectionsSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />
			<div className='space-y-8'>
				<div className='space-y-4'>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-10 rounded-2xl' />
						<div className='space-y-2'>
							<Skeleton className='h-5 w-32 rounded-full' />
							<Skeleton className='h-4 w-56 rounded-full' />
						</div>
					</div>
					<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
						<CardSkeleton className='min-h-72' />
						<CardSkeleton className='min-h-72' />
					</div>
				</div>

				<div className='space-y-4'>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-10 rounded-2xl' />
						<div className='space-y-2'>
							<Skeleton className='h-5 w-28 rounded-full' />
							<Skeleton className='h-4 w-64 rounded-full' />
						</div>
					</div>
					<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
						<CardSkeleton className='min-h-72' />
					</div>
				</div>
			</div>
		</div>
	);
}

export function ModerationSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />
			<CardSkeleton className='min-h-[32rem]' />
		</div>
	);
}

export function AvatarSkeleton() {
	return (
		<div className='container mx-auto space-y-8 px-4 py-8'>
			<div className='space-y-4'>
				<Skeleton className='h-12 w-72 rounded-2xl' />
				<Skeleton className='h-5 w-full max-w-2xl rounded-xl' />
			</div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<div className='space-y-6 lg:col-span-2'>
					<CardSkeleton className='min-h-64' />
					<CardSkeleton className='min-h-80' />
				</div>
				<div className='space-y-6'>
					<CardSkeleton className='min-h-56' />
					<CardSkeleton className='min-h-40' />
					<CardSkeleton className='min-h-32' />
				</div>
			</div>
		</div>
	);
}

export function SettingsSkeleton() {
	return (
		<div className='mx-auto w-full max-w-7xl px-4 py-6'>
			<div className='space-y-4'>
				<HeaderSkeleton />
				<Skeleton className='h-14 w-full rounded-2xl' />
				<div className='space-y-4'>
					<CardSkeleton className='min-h-80' />
					<CardSkeleton className='min-h-80' />
					<CardSkeleton className='min-h-80' />
					<CardSkeleton className='min-h-80' />
					<CardSkeleton className='min-h-80' />
				</div>
			</div>
		</div>
	);
}

export function AuthSkeleton() {
	return (
		<div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(122,92,204,0.16),_transparent_35%),linear-gradient(180deg,_rgba(10,10,12,1),_rgba(17,17,22,1))] px-4 py-10'>
			<div className='grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
				<CardSkeleton className='min-h-80' />
				<CardSkeleton className='min-h-80' />
			</div>
		</div>
	);
}

export function AccountSkeleton() {
	return (
		<div className='min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-violet-50/40 px-4 py-6 dark:to-background'>
			<div className='mx-auto flex w-full max-w-none flex-col gap-6'>
				<CardSkeleton className='min-h-[34rem]' />
			</div>
		</div>
	);
}

export function SignInSkeleton() {
	return (
		<div className='flex min-h-screen items-center justify-center px-4'>
			<CardSkeleton className='min-h-[30rem] w-full max-w-md' />
		</div>
	);
}
