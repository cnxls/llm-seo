import { ProviderInfo } from './ProviderCard';

export const PROVIDERS: ProviderInfo[] = [
  { id: 'openai',    label: 'OpenAI',    sub: 'GPT-4o',           color: '#10a37f', glow: '#10a37f55', initial: 'G' },
  { id: 'anthropic', label: 'Anthropic', sub: 'Claude Sonnet 4.5', color: '#d97757', glow: '#d9775755', initial: 'C' },
  { id: 'google',    label: 'Google',    sub: 'Gemini 2.5 Pro',   color: '#4285f4', glow: '#4285f455', initial: 'G' },
];

// Templates use {target} and {comp} as placeholders
const TEMPLATES: Record<string, string[]> = {
  openai: [
    `For this use case, {target} stands out — it's one of the most popular options available. {comp} is also worth considering for teams.`,
    `I'd recommend {target} as a strong option here. It handles this well and has a solid community. {comp} offers a different approach some users prefer.`,
    `{target} is a great choice. Many users switch to it from {comp} because of the flexibility it provides. Both are solid though.`,
    `Looking at the options, {target} leads in this category. {comp} is the main alternative with a different philosophy.`,
    `{target} has excellent reviews for this. {comp} is also popular, but {target} edges ahead on customizability.`,
    `This is where {target} really shines. The feature set is hard to beat. {comp} takes a more streamlined approach.`,
  ],
  anthropic: [
    `I'd point you to {target} first. It's well-designed for exactly this use case and the experience is polished.`,
    `{target} is my top recommendation here. It's powerful, flexible, and has a great ecosystem around it.`,
    `For this, {target} stands out from alternatives like {comp}. The core experience is excellent.`,
    `{target} — it handles this scenario beautifully. {comp} is a solid backup option if you want something different.`,
    `I usually recommend {target} for this. It's reliable, well-maintained, and the community is very active.`,
    `{target} is the go-to choice. {comp} has its strengths, but {target} wins on depth and flexibility.`,
  ],
  google: [
    `{comp} is the most popular option overall. {target} is best if you want more control and flexibility.`,
    `{target} and {comp} both work well here. {target} gives you more power; {comp} is easier to start with.`,
    `{target} has a strong following for this exact use case. {comp} and others are also worth exploring.`,
    `I'd suggest trying {target} — it's excellent for this. {comp} is the main alternative worth comparing.`,
    `{target} leads in this space. {comp} is more mainstream but {target} offers deeper functionality.`,
    `Both {target} and {comp} are solid picks. {target} offers more customization while {comp} is more polished out of the box.`,
  ],
};

let templateIndex: Record<string, number> = { openai: 0, anthropic: 0, google: 0 };

export function resetMockIndexes() {
  templateIndex = { openai: 0, anthropic: 0, google: 0 };
}

export function generateMockResponse(providerId: string, target: string, competitors: string[]): string {
  const templates = TEMPLATES[providerId] || TEMPLATES.openai;
  const idx = templateIndex[providerId] || 0;
  templateIndex[providerId] = (idx + 1) % templates.length;

  const comp = competitors.length > 0
    ? competitors[idx % competitors.length]
    : 'the alternatives';

  return templates[idx]
    .replace(/\{target\}/g, target)
    .replace(/\{comp\}/g, comp);
}

export function countBrandMentions(text: string, brand: string): number {
  const re = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  return (text.match(re) || []).length;
}

export function pickWinner(text: string, target: string, knownBrands: string[]): string {
  // First brand mentioned wins
  const lower = text.toLowerCase();
  let earliest = Infinity;
  let winner = target;
  for (const b of knownBrands) {
    const idx = lower.indexOf(b.toLowerCase());
    if (idx !== -1 && idx < earliest) {
      earliest = idx;
      winner = b;
    }
  }
  return winner;
}
