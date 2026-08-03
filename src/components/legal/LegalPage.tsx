import { ArrowLeft, CalendarClock, Mail, Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export interface LegalSubsection {
	title: string;
	body?: string[];
	list?: string[];
	closing?: string[];
}

export interface LegalSection {
	id: string;
	title: string;
	body?: string[];
	list?: string[];
	closing?: string[];
	subsections?: LegalSubsection[];
}

export interface LegalPageProps {
	title: string;
	badge: string;
	icon: 'privacy' | 'terms';
	effectiveDate: string;
	lastUpdated: string;
	description: string;
	contactEmail: string;
	sections: LegalSection[];
}

function LegalBody({
	body,
	list,
	closing,
}: {
	body?: string[];
	list?: string[];
	closing?: string[];
}) {
	return (
		<>
			{body?.map((paragraph, i) => (
				<p key={i} className='text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
					{paragraph}
				</p>
			))}
			{list && list.length > 0 && (
				<ul className='list-disc space-y-2 pl-5 text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
					{list.map((item, i) => (
						<li key={i}>{item}</li>
					))}
				</ul>
			)}
			{closing?.map((paragraph, i) => (
				<p key={i} className='text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
					{paragraph}
				</p>
			))}
		</>
	);
}

function LegalBlock({ section }: { section: LegalSection }) {
	return (
		<>
			<LegalBody body={section.body} list={section.list} closing={section.closing} />
			{section.subsections?.map((sub, i) => (
				<div key={i} className='rounded-xl border border-border/70 bg-background/50 p-4 md:p-6'>
					<h3 className='font-semibold text-sm text-zinc-900 dark:text-zinc-50'>{sub.title}</h3>
					<div className='mt-3 space-y-3'>
						<LegalBody body={sub.body} list={sub.list} closing={sub.closing} />
					</div>
				</div>
			))}
		</>
	);
}

export function LegalPage({
	title,
	badge,
	icon,
	effectiveDate,
	lastUpdated,
	description,
	contactEmail,
	sections,
}: LegalPageProps) {
	const HeaderIcon = icon === 'privacy' ? ShieldCheck : Scale;

	return (
		<div className='relative min-h-screen bg-[#F6F3FC] px-4 py-10 sm:px-6 md:py-16 dark:bg-[#0B0A12]'>
			<div className='mx-auto max-w-5xl'>
				<Link
					href='/'
					className='inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground'
				>
					<ArrowLeft size={16} />
					Volver al inicio
				</Link>

				<header className='mt-10'>
					<span className='inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 font-semibold text-violet-700 text-xs uppercase tracking-widest dark:text-[#C4B5FD]'>
						<HeaderIcon size={14} />
						{badge}
					</span>
					<h1 className='mt-5 font-extrabold text-3xl text-zinc-900 leading-[1.05] [font-family:var(--font-unbounded)] sm:text-4xl md:text-5xl dark:text-zinc-50'>
						{title}
					</h1>
					<p className='mt-5 max-w-3xl text-base text-zinc-600 leading-relaxed dark:text-zinc-400'>
						{description}
					</p>
					<div className='mt-6 flex flex-wrap items-center gap-3 text-muted-foreground text-sm'>
						<span className='inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5'>
							<CalendarClock size={14} />
							Vigencia: {effectiveDate}
						</span>
						<span className='inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5'>
							<CalendarClock size={14} />
							Última actualización: {lastUpdated}
						</span>
					</div>
				</header>

				<nav aria-label='Índice' className='mt-12'>
					<p className='mb-4 font-semibold text-muted-foreground text-xs uppercase tracking-widest'>
						Índice
					</p>
					<ol className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
						{sections.map((section, index) => (
							<li key={section.id}>
								<a
									href={`#${section.id}`}
									className='group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 dark:hover:bg-[#8B5CF6]/10'
								>
									<span className='font-bold font-mono text-[#8B5CF6] text-xs'>
										{String(index + 1).padStart(2, '0')}
									</span>
									<span className='font-medium text-zinc-800 transition-colors group-hover:text-[#8B5CF6] dark:text-zinc-100 dark:group-hover:text-[#C4B5FD]'>
										{section.title}
									</span>
								</a>
							</li>
						))}
					</ol>
				</nav>

				<div className='mt-12 space-y-6'>
					{sections.map((section, index) => (
						<section
							key={section.id}
							id={section.id}
							className='scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10'
						>
							<h2 className='flex items-baseline gap-3 font-bold text-lg text-zinc-900 [font-family:var(--font-unbounded)] sm:text-xl dark:text-zinc-50'>
								<span className='text-[#8B5CF6] text-sm'>{String(index + 1).padStart(2, '0')}</span>
								{section.title}
							</h2>
							<div className='mt-5 space-y-4'>
								<LegalBlock section={section} />
							</div>
						</section>
					))}
				</div>

				<footer className='mt-12 rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#22D3EE]/10 p-6 md:p-8'>
					<h2 className='font-bold text-lg text-zinc-900 [font-family:var(--font-unbounded)] dark:text-zinc-50'>
						¿Dudas o solicitudes?
					</h2>
					<p className='mt-2 text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
						Para consultas de privacidad, soporte o ejercer tus derechos, contáctanos en:
					</p>
					<a
						href={`mailto:${contactEmail}`}
						className='mt-4 inline-flex items-center gap-2 font-semibold text-[#8B5CF6] text-sm transition-colors hover:text-[#7C4DFF] dark:text-[#C4B5FD]'
					>
						<Mail size={16} />
						{contactEmail}
					</a>
				</footer>
			</div>
		</div>
	);
}
