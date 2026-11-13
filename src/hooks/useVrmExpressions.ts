'use client';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { useSyncExternalStore } from 'react';
const empty: string[] = [];
const subscribe = (listener: () => void) => vrmManager.subscribe(listener);
const getSnapshot = () => vrmManager.getAvailableExpressions();
const getServerSnapshot = () => empty;
export function useVrmExpressions() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
const getActiveSnapshot = () => vrmManager.getActiveExpressions();
export function useVrmActiveExpressions() {
	return useSyncExternalStore(subscribe, getActiveSnapshot, getServerSnapshot);
}

const emptyWeights: Record<string, number> = {};
const getWeightSnapshot = () => vrmManager.getActiveExpressionWeights();
export function useVrmExpressionWeights() {
	return useSyncExternalStore(subscribe, getWeightSnapshot, () => emptyWeights);
}
