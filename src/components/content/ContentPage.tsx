import { ArrowLeft, ArrowRight, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

export interface ContentSection {
	id: string;
	title: string;
	body?: string[];
	list?: string[];
}

export interface ContentFaq {
	question: string;
	answer: string;
}

export interface RelatedLink {
	href: string;
	title: string;
	description: string;
}

export interface ContentPageProps {
	badge: string;
	title: string;
	description: string;
	sections: ContentSection[];
	faqs?: ContentFaq[];
	related?: RelatedLink[];
}

export function ContentPage({
	badge,
	title,
	description,
	sections,
	faqs,
	related,
}: ContentPageProps) {
	return (
		<div className='relative min-h-screen bg-[#F6F3FC] px-4 py-10 sm:px-6 md:py-16 dark:bg-[#0B0A12]'>
			<div className='mx-auto max-w-4xl'>
				<Link
					href='/'
					className='inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground'
				>
					<ArrowLeft size={16} />
					Volver al inicio
				</Link>

				<header className='mt-10'>
					<span className='inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 font-semibold text-violet-700 text-xs uppercase tracking-widest dark:text-[#C4B5FD]'>
						<Sparkles size={14} />
						{badge}
					</span>
					<h1 className='mt-5 font-extrabold text-3xl text-zinc-900 leading-[1.05] [font-family:var(--font-unbounded)] sm:text-4xl md:text-5xl dark:text-zinc-50'>
						{title}
					</h1>
					<p className='mt-5 max-w-3xl text-base text-zinc-600 leading-relaxed dark:text-zinc-400'>
						{description}
					</p>
				</header>

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
								{section.body?.map((paragraph, i) => (
									<p key={i} className='text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
										{paragraph}
									</p>
								))}
								{section.list && section.list.length > 0 && (
									<ul className='space-y-2.5'>
										{section.list.map((item, i) => (
											<li
												key={i}
												className='flex items-start gap-2.5 text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'
											>
												<Star
													size={12}
													className='mt-1.5 shrink-0 fill-amber-400/70 text-amber-500 dark:fill-[#FDE68A]/60 dark:text-[#FDE68A]'
												/>
												{item}
											</li>
										))}
									</ul>
								)}
							</div>
						</section>
					))}
				</div>

				{faqs && faqs.length > 0 && (
					<section className='mt-12'>
						<h2 className='font-bold text-lg text-zinc-900 [font-family:var(--font-unbounded)] sm:text-xl dark:text-zinc-50'>
							Preguntas frecuentes
						</h2>
						<div className='mt-5 space-y-3'>
							{faqs.map((faq) => (
								<details
									key={faq.question}
									className='group rounded-2xl border border-border bg-card p-5 open:border-[#8B5CF6]/40'
								>
									<summary className='cursor-pointer list-none font-medium text-sm text-zinc-800 dark:text-zinc-100 [&::-webkit-details-marker]:hidden'>
										{faq.question}
									</summary>
									<p className='mt-3 text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
										{faq.answer}
									</p>
								</details>
							))}
						</div>
					</section>
				)}

				{related && related.length > 0 && (
					<section className='mt-12'>
						<h2 className='font-bold text-lg text-zinc-900 [font-family:var(--font-unbounded)] sm:text-xl dark:text-zinc-50'>
							Sigue leyendo
						</h2>
						<div className='mt-5 grid gap-3 sm:grid-cols-2'>
							{related.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className='group flex h-full flex-col gap-1.5 rounded-2xl border border-border bg-card p-5 text-sm transition-colors hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 dark:hover:bg-[#8B5CF6]/10'
								>
									<span className='font-semibold text-zinc-800 transition-colors group-hover:text-[#8B5CF6] dark:text-zinc-100 dark:group-hover:text-[#C4B5FD]'>
										{link.title}
									</span>
									<span className='text-zinc-500 leading-relaxed dark:text-zinc-400'>
										{link.description}
									</span>
								</Link>
							))}
						</div>
					</section>
				)}

				<section className='mt-12 rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#22D3EE]/10 p-6 md:p-8'>
					<h2 className='font-bold text-lg text-zinc-900 [font-family:var(--font-unbounded)] dark:text-zinc-50'>
						Prueba Sandy Studio gratis
					</h2>
					<p className='mt-2 text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
						Conecta tu canal de Twitch o Kick, elige el modelo de IA, la voz y el avatar. Sin
						tarjeta de crédito.
					</p>
					<Link
						href='/sign-up'
						className='group mt-5 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6] px-6 py-3 font-semibold text-sm text-white shadow-[0_0_28px_rgba(139,92,246,0.4)] transition-all hover:bg-[#7C4DFF] hover:shadow-[0_0_36px_rgba(139,92,246,0.6)]'
					>
						Crear cuenta gratis
						<ArrowRight size={16} className='transition-transform group-hover:translate-x-1' />
					</Link>
				</section>
			</div>
		</div>
	);
}
