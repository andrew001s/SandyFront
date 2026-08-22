import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	// Plantillas y scripts de skills/agentes: código vendorizado, no se lintea.
	{
		ignores: ['.agents/**', '.claude/**'],
	},
	...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
