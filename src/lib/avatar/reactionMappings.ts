const automaticReactionMappings: Record<string, string> = {};

export function getAutomaticReactionMappings(): Record<string, string> {
	return { ...automaticReactionMappings };
}

export function getAutomaticReactionMapping(reaction: string): string | undefined {
	return automaticReactionMappings[reaction];
}

export function setAutomaticReactionMapping(reaction: string, expressionId: string | null): void {
	if (expressionId) {
		automaticReactionMappings[reaction] = expressionId;
	} else {
		delete automaticReactionMappings[reaction];
	}
}
