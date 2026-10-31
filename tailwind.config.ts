import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme: { extend: { colors: { aura: { 950:'#090917',900:'#11112a',500:'#9b5cff' } } } }, plugins: [] } satisfies Config;
