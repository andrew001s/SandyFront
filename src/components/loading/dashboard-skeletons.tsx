import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function HeaderSkeleton() {
	return (
		<div className='mb-6 space-y-2'>
			<Skeleton className='h-3.5 w-36 rounded-md' />
			<Skeleton className='h-8 w-64 rounded-lg' />
			<Skeleton className='h-4 w-full max-w-lg rounded-md' />
		</div>
	);
}

export function CardSkeleton({ className = '' }: { className?: string }) {
	return (
		<div className={cn('rounded-xl border border-border/60 bg-card p-5 shadow-xs', className)}>
			<div className='flex items-center justify-between'>
				<Skeleton className='size-9 rounded-lg' />
				<Skeleton className='h-5 w-20 rounded-full' />
			</div>
			<div className='mt-4 space-y-2'>
				<Skeleton className='h-5 w-3/4 rounded-md' />
				<Skeleton className='h-4 w-full rounded-md' />
			</div>
		</div>
	);
}

export function HomeSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />

			{/* Controles Principales */}
			<div className='mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2'>
				<ServiceStartSkeleton />
				<div className='rounded-xl border border-border/60 bg-card p-5 shadow-xs'>
					<div className='flex items-center justify-between'>
						<Skeleton className='size-10 rounded-xl' />
						<Skeleton className='h-5 w-24 rounded-full' />
					</div>
					<div className='mt-4 space-y-2'>
						<Skeleton className='h-5 w-40 rounded-md' />
						<Skeleton className='h-4 w-56 rounded-md' />
					</div>
				</div>
			</div>

			{/* Support Card */}
			<Skeleton className='h-16 w-full rounded-xl border border-border/60 bg-card' />

			{/* Terminal de Emisión */}
			<div className='mt-6 rounded-xl border border-border/60 bg-card p-5 shadow-xs'>
				<div className='flex items-center justify-between border-border/50 border-b pb-3'>
					<Skeleton className='h-5 w-36 rounded-md' />
					<Skeleton className='h-5 w-24 rounded-full' />
				</div>
				<div className='mt-4 space-y-2'>
					<Skeleton className='h-4 w-full rounded-md font-mono' />
					<Skeleton className='h-4 w-4/5 rounded-md font-mono' />
					<Skeleton className='h-4 w-2/3 rounded-md font-mono' />
					<Skeleton className='h-24 w-full rounded-md font-mono' />
				</div>
			</div>
		</div>
	);
}

export function ServiceStartSkeleton() {
	return (
		<div className='flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 shadow-xs'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<div className='space-y-1.5'>
						<Skeleton className='h-4 w-32 rounded-md' />
						<Skeleton className='h-3 w-44 rounded-md' />
					</div>
				</div>
				<Skeleton className='h-5 w-16 rounded-full' />
			</div>
			<div className='mt-5 flex items-center justify-between gap-3 border-border/50 border-t pt-3'>
				<Skeleton className='h-4 w-28 rounded-md' />
				<Skeleton className='h-8 w-28 rounded-lg' />
			</div>
		</div>
	);
}

export function FeatureFlagsSkeleton() {
	return (
		<div className='rounded-xl border border-border/60 bg-card shadow-xs'>
			<div className='border-border/50 border-b px-5 py-4'>
				<div className='flex items-center justify-between'>
					<div className='space-y-1.5'>
						<Skeleton className='h-5 w-48 rounded-md' />
						<Skeleton className='h-3.5 w-72 rounded-md' />
					</div>
					<Skeleton className='h-8 w-24 rounded-lg' />
				</div>
			</div>
			<div className='grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={`feature-skeleton-${index}`}
						className='rounded-xl border border-border/60 bg-background/50 p-4'
					>
						<div className='flex items-center justify-between'>
							<Skeleton className='size-8 rounded-lg' />
							<Skeleton className='h-5 w-10 rounded-full' />
						</div>
						<div className='mt-3 space-y-1.5'>
							<Skeleton className='h-4 w-28 rounded-md' />
							<Skeleton className='h-3 w-36 rounded-md' />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function ConnectionCardSkeleton() {
	return (
		<div className='flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 shadow-xs'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<div className='space-y-1.5'>
						<Skeleton className='h-5 w-32 rounded-md' />
						<Skeleton className='h-3 w-40 rounded-md' />
					</div>
				</div>
				<Skeleton className='h-5 w-20 rounded-full' />
			</div>
			<div className='mt-6 space-y-3'>
				<Skeleton className='h-8 w-full rounded-lg' />
			</div>
		</div>
	);
}

export function ConnectionsSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />
			<div className='space-y-8'>
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<Skeleton className='h-4 w-32 rounded-md' />
						<Skeleton className='h-4 w-24 rounded-md' />
					</div>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<ConnectionCardSkeleton />
						<ConnectionCardSkeleton />
						<ConnectionCardSkeleton />
					</div>
				</div>
			</div>
		</div>
	);
}

export function ModerationSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />
			<div className='rounded-xl border border-border/60 bg-card p-6 shadow-xs'>
				<div className='flex items-center justify-between border-border/50 border-b pb-4'>
					<div className='space-y-1.5'>
						<Skeleton className='h-5 w-44 rounded-md' />
						<Skeleton className='h-3.5 w-72 rounded-md' />
					</div>
					<Skeleton className='h-8 w-28 rounded-lg' />
				</div>
				<div className='mt-4 space-y-2'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={`mod-row-${i}`} className='h-12 w-full rounded-xl' />
					))}
				</div>
			</div>
		</div>
	);
}

export function AvatarSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-4 py-8 md:px-6'>
			<HeaderSkeleton />

			{/* Tabs */}
			<div className='flex items-center justify-between'>
				<Skeleton className='h-10 w-80 rounded-lg' />
				<Skeleton className='h-4 w-36 rounded-md' />
			</div>

			{/* 2 Columnas items-start */}
			<div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
				<div className='h-48 rounded-xl border border-border/60 bg-card p-5'>
					<Skeleton className='h-6 w-36 rounded-md' />
					<div className='mt-4 space-y-3'>
						<Skeleton className='h-9 w-full rounded-lg' />
						<Skeleton className='h-8 w-28 rounded-lg' />
					</div>
				</div>
				<div className='h-80 rounded-xl border border-border/60 bg-card p-5'>
					<Skeleton className='h-6 w-44 rounded-md' />
					<div className='mt-4 space-y-3'>
						<Skeleton className='h-9 w-full rounded-lg' />
						<div className='flex gap-2'>
							<Skeleton className='h-9 flex-1 rounded-lg' />
							<Skeleton className='h-9 flex-1 rounded-lg' />
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Card */}
			<div className='h-56 rounded-xl border border-border/60 bg-card p-5'>
				<Skeleton className='h-6 w-52 rounded-md' />
				<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
					<Skeleton className='h-20 rounded-xl' />
					<Skeleton className='h-20 rounded-xl' />
				</div>
			</div>
		</div>
	);
}

export function SettingsSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />
			<div className='space-y-4'>
				{/* Toolbar */}
				<Skeleton className='h-14 w-full rounded-xl border border-border/60 bg-card' />

				{/* Tabs Bar */}
				<Skeleton className='h-10 w-full rounded-lg border border-border/70 bg-card' />

				{/* Section Content */}
				<div className='h-80 rounded-xl border border-border/60 bg-card p-6'>
					<div className='flex items-center gap-3 border-border/50 border-b pb-4'>
						<Skeleton className='size-10 rounded-xl' />
						<div className='space-y-1.5'>
							<Skeleton className='h-5 w-44 rounded-md' />
							<Skeleton className='h-3.5 w-64 rounded-md' />
						</div>
					</div>
					<div className='mt-5 space-y-4'>
						<Skeleton className='h-10 w-full rounded-lg' />
						<Skeleton className='h-10 w-full rounded-lg' />
					</div>
				</div>
			</div>
		</div>
	);
}

export function AccountSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
			<HeaderSkeleton />
			<div className='h-96 w-full rounded-xl border border-border/60 bg-card p-6 shadow-xs'>
				<Skeleton className='h-full w-full rounded-lg' />
			</div>
		</div>
	);
}

export function SignInSkeleton() {
	return (
		<div className='flex min-h-screen items-center justify-center px-4'>
			<div className='w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl'>
				<Skeleton className='h-10 w-36 rounded-md' />
				<div className='mt-6 space-y-4'>
					<Skeleton className='h-10 w-full rounded-lg' />
					<Skeleton className='h-10 w-full rounded-lg' />
					<Skeleton className='h-10 w-full rounded-lg' />
				</div>
			</div>
		</div>
	);
}

export function AuthSkeleton() {
	return <SignInSkeleton />;
}

export function LandingSkeleton() {
	return (
		<div className='min-h-screen bg-background px-4 py-8'>
			<div className='mx-auto flex w-full max-w-5xl flex-col gap-8'>
				<div className='flex items-center justify-between'>
					<Skeleton className='h-10 w-40 rounded-xl' />
					<Skeleton className='h-9 w-28 rounded-lg' />
				</div>
				<div className='space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-xs'>
					<Skeleton className='h-12 w-full max-w-2xl rounded-lg' />
					<Skeleton className='h-6 w-full max-w-xl rounded-md' />
					<div className='grid gap-4 md:grid-cols-2'>
						<Skeleton className='h-64 rounded-xl' />
						<Skeleton className='h-64 rounded-xl' />
					</div>
				</div>
			</div>
		</div>
	);
}
