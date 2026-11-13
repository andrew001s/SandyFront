'use client';

import { useOnboarding } from '@onboardjs/react';
import {
	type ReactNode,
	createContext,
	createElement,
	useCallback,
	useContext,
	useMemo,
	useRef,
} from 'react';
import type { OnboardingFlowData, SandyOnboardingContext } from './onboarding.types';

type DraftValue = {
	data: OnboardingFlowData;
	update: (patch: Partial<OnboardingFlowData>) => Promise<void>;
};
const DraftContext = createContext<DraftValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const draft = useRef<OnboardingFlowData>({});
	const pending = useRef(0);
	const queue = useRef(Promise.resolve());
	if (state && pending.current === 0) {
		draft.current = state.context.flowData ?? {};
	}
	const update = useCallback(
		(patch: Partial<OnboardingFlowData>) => {
			const snapshot = { ...draft.current, ...patch };
			draft.current = snapshot;
			pending.current += 1;
			queue.current = queue.current
				.catch(() => undefined)
				.then(() => updateContext({ flowData: snapshot }))
				.finally(() => {
					pending.current -= 1;
				});
			return queue.current;
		},
		[updateContext],
	);
	const data = state?.context.flowData;
	const value = useMemo(() => ({ data: data ?? {}, update }), [data, update]);
	return createElement(DraftContext.Provider, { value }, children);
}

export function useOnboardingDraft() {
	const context = useContext(DraftContext);
	if (!context) throw new Error('El borrador necesita OnboardingDraftProvider.');
	return context;
}
