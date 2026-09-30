import { defaultCampaigns, type CampaignBlock, type HomeCampaigns } from '@/content/campaigns';
import { store } from '../store/json-store';

type Override = Partial<Record<Exclude<keyof HomeCampaigns, 'announcements'>, Partial<CampaignBlock>>> & {
  announcements?: HomeCampaigns['announcements'];
};

/** Campañas de la home = valores por defecto + overrides guardados desde /admin/campaigns. */
export async function getCampaigns(): Promise<HomeCampaigns> {
  const o = await store.read<Override>('campaigns', {});
  const merge = (k: Exclude<keyof HomeCampaigns, 'announcements'>): CampaignBlock => ({ ...defaultCampaigns[k], ...o[k] });
  return {
    announcements: o.announcements?.length ? o.announcements : defaultCampaigns.announcements,
    hero: merge('hero'),
    jewelry: merge('jewelry'),
    watches: merge('watches'),
    fashion: merge('fashion'),
    story: merge('story'),
  };
}

export async function saveCampaignOverride(block: Exclude<keyof HomeCampaigns, 'announcements'>, patch: Partial<CampaignBlock>): Promise<void> {
  await store.update<Override>('campaigns', {}, (cur) => ({ ...cur, [block]: { ...cur[block], ...patch } }));
}
