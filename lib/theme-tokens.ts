export type StyleTokens = {
  palette?: { primary?: string; secondary?: string; background?: string };
  glass?: { opacity?: number; blur?: number };
  radius?: number;
  shadow?: { elevation?: number };
  typography?: { scale?: number };
};
function setVar(name: string, value: string) {
  try { document.documentElement.style.setProperty(name, value); } catch {}
}
export function applyStyleTokens(tokens?: StyleTokens, target?: HTMLElement){
  const p = tokens?.palette || {}
  if (p.primary)   setVar('--brand-primary', p.primary)
  if (p.secondary) setVar('--brand-accent',  p.secondary)
  if (p.background)setVar('--bg-top',        p.background), setVar('--bg-bot', p.background)
  if (tokens?.glass){
    const op = Math.min(1, Math.max(0, Number(tokens.glass.opacity ?? 0.7)))
    setVar('--glass', `rgba(255,255,255,${op})`)
  }
}
