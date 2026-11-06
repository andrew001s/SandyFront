'use client';

import { getSettings, saveSettings } from '@/api/settings';
import { useAuth } from '@clerk/nextjs';
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';

type Bindings = Record<string, string>;
type ContextValue = {
	bindings: Bindings;
	status: 'loading' | 'ready' | 'saving' | 'error';
	setBinding: (scope: string, id: string, chord: string | null) => string | null;
	retry: () => void;
};
const Context = createContext<ContextValue | null>(null);
export const useExpressionHotkeysContext = () => useContext(Context);

export function ExpressionHotkeysProvider({ children }: { children: ReactNode }) {
	const { userId, isLoaded, isSignedIn, getToken } = useAuth();
	const [bindings, setBindings] = useState<Bindings>({});
	const [status, setStatus] = useState<ContextValue['status']>('loading');
	const [reload, setReload] = useState(0);
	const owner = useRef(userId);
	owner.current = userId;
	const current = useRef<Bindings>({});
	const hydrated = useRef(false);
	const queue = useRef<Promise<void>>(Promise.resolve());
	const revision = useRef(0);
	useEffect(() => {
		let cancelled = false;
		hydrated.current = false;
		current.current = {};
		setBindings({});
		setStatus('loading');
		revision.current++;
		if (!isLoaded || !isSignedIn || !userId) return;
		queue.current = queue.current
			.catch(() => undefined)
			.then(async () => {
				if (cancelled) return;
				try {
					const token = await getToken();
					if (cancelled) return;
					const result = await getSettings({ token });
					if (cancelled) return;
					const saved = result.settings?.expression_hotkeys ?? {};
					current.current = saved;
					setBindings(saved);
					hydrated.current = true;
					setStatus('ready');
				} catch {
					if (!cancelled) setStatus('error');
				}
			});
		return () => {
			cancelled = true;
		};
	}, [userId, isLoaded, isSignedIn, getToken, reload]);
	const persist = useCallback(
		(snapshot: Bindings) => {
			const account = userId;
			const version = ++revision.current;
			setStatus('saving');
			queue.current = queue.current
				.catch(() => undefined)
				.then(async () => {
					if (!account || owner.current !== account) return;
					try {
						const token = await getToken();
						if (owner.current !== account) return;
						await saveSettings({ expression_hotkeys: snapshot }, { token });
						if (owner.current === account && revision.current === version) setStatus('ready');
					} catch {
						if (owner.current === account && revision.current === version) setStatus('error');
					}
				});
		},
		[getToken, userId],
	);
	const setBinding = (scope: string, id: string, chord: string | null) => {
		if (!hydrated.current) return 'Espera a que se carguen tus atajos.';
		const key = `${scope}:${id}`;
		if (
			chord &&
			Object.entries(current.current).some(
				([other, value]) => other !== key && other.startsWith(`${scope}:`) && value === chord,
			)
		)
			return 'Esa combinación ya está asignada a otra expresión de este formato.';
		const next = { ...current.current };
		if (chord) next[key] = chord;
		else delete next[key];
		current.current = next;
		setBindings(next);
		persist(next);
		return null;
	};
	return (
		<Context.Provider
			value={{
				bindings,
				status,
				setBinding,
				retry: () => (hydrated.current ? persist(current.current) : setReload((n) => n + 1)),
			}}
		>
			{children}
		</Context.Provider>
	);
}
