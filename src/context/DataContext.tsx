import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Sponsor,
  HeroSlide,
  Banner,
  SocialLink,
  WheelReward,
  Giveaway,
  StoreProduct,
  SiteSettings,
} from '../types';
import { db } from '../lib/db';
import { initialSiteSettings } from '../lib/initialData';

interface DataContextType {
  sponsors: Sponsor[];
  activeSponsors: Sponsor[];
  featuredSponsors: Sponsor[];
  heroSlides: HeroSlide[];
  banners: Banner[];
  leftBanners: Banner[];
  rightBanners: Banner[];
  socialLinks: SocialLink[];
  wheelRewards: WheelReward[];
  giveaways: Giveaway[];
  storeProducts: StoreProduct[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [wheelRewards, setWheelRewards] = useState<WheelReward[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(initialSiteSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFirstLoadRef = React.useRef(true);

  const loadData = useCallback(async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner || isFirstLoadRef.current) {
        setLoading(true);
      }
      setError(null);

      // Preload data from server-side Supabase proxy if available
      await db.preloadAll();

      const [
        loadedSponsors,
        loadedSlides,
        loadedBanners,
        loadedSocials,
        loadedRewards,
        loadedGiveaways,
        loadedProducts,
        loadedSettings,
      ] = await Promise.all([
        db.getSponsors(),
        db.getHeroSlides(),
        db.getBanners(),
        db.getSocialLinks(),
        db.getWheelRewards(),
        db.getGiveaways(),
        db.getStoreProducts(),
        db.getSettings(),
      ]);

      setSponsors(loadedSponsors);
      setHeroSlides(loadedSlides);
      setBanners(loadedBanners);
      setSocialLinks(loadedSocials);
      setWheelRewards(loadedRewards);
      setGiveaways(loadedGiveaways);
      setStoreProducts(loadedProducts);
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Failed to load portal data:', err);
      setError('Veriler yüklenirken bir problem oluştu. Lütfen sayfayı yenileyiniz.');
    } finally {
      isFirstLoadRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);

    // Listen to changes across views with debounce
    let debounceTimer: any = null;
    const handler = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData(false);
      }, 300);
    };
    window.addEventListener('sponsorhub_db_change', handler);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('sponsorhub_db_change', handler);
    };
  }, [loadData]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
  };

  const activeSponsors = sponsors.filter((s) => s.active);
  const featuredSponsors = activeSponsors.filter((s) => s.featured);
  const activeBanners = banners.filter((b) => b.active);
  const leftBanners = activeBanners.filter((b) => b.position === 'left' || activeBanners.length === 1);
  const rightBanners = activeBanners.filter((b) => b.position === 'right' && activeBanners.length > 1);

  return (
    <DataContext.Provider
      value={{
        sponsors,
        activeSponsors,
        featuredSponsors,
        heroSlides: heroSlides.filter((s) => s.active),
        banners,
        leftBanners,
        rightBanners,
        socialLinks: socialLinks.filter((s) => s.active),
        wheelRewards,
        giveaways: giveaways.filter((g) => g.active),
        storeProducts: storeProducts.filter((p) => p.active),
        settings,
        loading,
        error,
        refreshAll: loadData,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
