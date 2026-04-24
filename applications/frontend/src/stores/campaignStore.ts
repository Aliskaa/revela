import { create } from 'zustand';

type CampaignStore = {
    /** campaign_id of the selected campaign, or null for auto-select (first active). */
    selectedCampaignId: number | null;
    select: (campaignId: number) => void;
    clear: () => void;
};

export const useCampaignStore = create<CampaignStore>(set => ({
    selectedCampaignId: null,
    select: campaignId => set({ selectedCampaignId: campaignId }),
    clear: () => set({ selectedCampaignId: null }),
}));
