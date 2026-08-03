import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VTSExpression } from '@/hooks/useVTubeStudio';
import { FiSmile } from 'react-icons/fi';

type AvatarExpressionsCardProps = {
	connected: boolean;
	expressions: VTSExpression[];
	onSetExpression: (nameOrFile: string, active: boolean) => undefined | Promise<boolean>;
};

export function AvatarExpressionsCard({
	connected,
	expressions,
	onSetExpression,
}: AvatarExpressionsCardProps) {
	if (!connected) {
		return null;
	}

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<FiSmile size={18} className='text-chart-1' />
					Expresiones
				</CardTitle>
				<CardDescription>Dispará las expresiones del modelo activo</CardDescription>
			</CardHeader>
			<CardContent>
				{expressions.length === 0 ? (
					<p className='py-2 text-center text-muted-foreground text-xs'>
						El modelo activo no tiene expresiones configuradas.
					</p>
				) : (
					<div className='flex max-h-44 flex-wrap gap-2 overflow-y-auto'>
						{expressions.map((expression) => (
							<Button
								key={expression.file}
								size='sm'
								variant={expression.active ? 'default' : 'outline'}
								onClick={() => {
									void onSetExpression(expression.file, !expression.active);
								}}
							>
								{expression.name}
							</Button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
