'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	type SandyCoreConfig,
	downloadSandyCoreTemplate,
	normalizeSandyCoreConfig,
} from '@/lib/sandycore-config';
import { cn } from '@/lib/utils';
import { CheckCircle2, Download, FileJson, ShieldCheck, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type SandyCoreConfigPanelProps = {
	config: SandyCoreConfig;
	onConfigChange: (config: SandyCoreConfig) => void;
};

export function SandyCoreConfigPanel({ config, onConfigChange }: SandyCoreConfigPanelProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const applyConfig = (parsed: unknown, name?: string) => {
		try {
			onConfigChange(normalizeSandyCoreConfig(parsed));
			setFileName(name ?? null);
			toast.success('Configuración cargada del archivo');
		} catch {
			toast.error('El archivo no contiene un JSON válido');
		}
	};

	const handleFile = (file: File) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const parsed: unknown = JSON.parse(String(reader.result));
				applyConfig(parsed, file.name);
			} catch {
				toast.error('El archivo no contiene un JSON válido');
			}
		};
		reader.readAsText(file);
	};

	const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
		event.preventDefault();
		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		if (file) {
			handleFile(file);
		}
	};

	const personaName = config.persona_profile?.name ?? 'Sin personalidad cargada';
	const bannedCounts = {
		words: config.custom_banned_words?.length ?? 0,
		symbols: config.custom_banned_symbols?.length ?? 0,
		links: config.custom_banned_links?.length ?? 0,
	};
	const hasConfig = Boolean(config.persona_profile || config.prompt_overrides);

	return (
		<Card className='h-full overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl'>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex min-w-0 items-start gap-4'>
						<div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-violet-600 shadow-sm'>
							<Sparkles className='size-5' />
						</div>
						<div className='space-y-1'>
							<CardTitle className='text-xl'>Personalidad de la VTuber</CardTitle>
							<CardDescription className='max-w-xl'>
								Descarga la plantilla, rellénala con la personalidad y los prompts de tu VTuber y
								arrástrala aquí para cargarla.
							</CardDescription>
						</div>
					</div>
					<Badge
						variant='outline'
						className={
							hasConfig
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
								: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
						}
					>
						{hasConfig ? 'Personalidad cargada' : 'Sin personalidad'}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className='space-y-6 px-5 py-5 sm:px-6'>
				<div className='grid gap-4 sm:grid-cols-2'>
					<div className='rounded-2xl border border-border/60 bg-background/60 p-4'>
						<div className='flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em]'>
							<FileJson className='size-4 text-violet-600 dark:text-[#A78BFA]' />
							Personalidad cargada
						</div>
						<p className='mt-2 font-medium text-lg'>{personaName}</p>
						{config.persona_profile?.archetype ? (
							<p className='text-muted-foreground text-sm'>{config.persona_profile.archetype}</p>
						) : (
							<p className='text-muted-foreground text-sm'>
								Usará el fallback genérico del backend.
							</p>
						)}
					</div>
					<div className='rounded-2xl border border-border/60 bg-background/60 p-4'>
						<div className='flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em]'>
							<ShieldCheck className='size-4 text-emerald-500' />
							Moderación
						</div>
						<div className='mt-2 flex flex-wrap gap-2'>
							<Badge variant='outline'>{bannedCounts.words} palabras</Badge>
							<Badge variant='outline'>{bannedCounts.symbols} símbolos</Badge>
							<Badge variant='outline'>{bannedCounts.links} links</Badge>
						</div>
					</div>
				</div>

				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(event) => {
						event.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={handleDrop}
					className={cn(
						'flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-violet-500/50',
						isDragging
							? 'border-violet-500 bg-violet-500/10'
							: 'border-border/60 bg-background/60 hover:border-violet-500/50 hover:bg-violet-500/5',
					)}
				>
					<div className='flex size-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'>
						<FileJson className='size-7' />
					</div>
					<div>
						<p className='font-medium'>
							{fileName ? `Archivo cargado: ${fileName}` : 'Arrastra tu archivo JSON aquí'}
						</p>
						<p className='text-muted-foreground text-sm'>
							{fileName
								? 'Suéltalo para reemplazar la configuración actual'
								: 'o haz clic para seleccionarlo'}
						</p>
					</div>
					{hasConfig && !fileName ? (
						<div className='flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-600 text-xs dark:text-emerald-400'>
							<CheckCircle2 className='size-3.5' />
							Usando la configuración guardada
						</div>
					) : null}
				</button>
				<input
					ref={fileInputRef}
					type='file'
					accept='.json,application/json'
					className='hidden'
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) {
							handleFile(file);
						}
						event.target.value = '';
					}}
				/>
				<div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
					<Button type='button' variant='outline' onClick={downloadSandyCoreTemplate}>
						<Download className='size-4' />
						Descargar plantilla
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
