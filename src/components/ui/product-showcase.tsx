'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Battery,
  Monitor,
  Calendar,
  MapPin,
  Package,
  Tag,
  Hash,
  ChevronRight,
  Zap,
  ShieldCheck,
  Barcode,
  FileText,
  Ruler,
  type LucideIcon,
} from 'lucide-react';

// =========================================
// 1. TYPES
// =========================================

export type ShowcaseTab = 'overview' | 'specs';

export interface ProductFeature {
  label: string;
  value: string;
  icon: LucideIcon;
  /** 0-100 for progress bar, omit to hide bar */
  progress?: number;
}

export interface ProductShowcaseProps {
  /** Product title / model */
  title: string;
  /** Brand name */
  brand?: string;
  /** Short description or subtitle */
  description?: string;
  /** SKU / inventory number */
  sku?: string;
  /** Main image URL */
  image: string;
  /** Fallback image URL */
  fallbackImage?: string;
  /** Condition label */
  condition?: string;
  /** Condition badge color classes */
  conditionColor?: string;
  /** Category */
  category?: string;
  /** Quantity available */
  quantity?: number;
  /** Location */
  location?: string;
  /** Price formatted string or null for "on request" */
  price?: string | null;
  /** Features list for specs tab */
  features?: ProductFeature[];
  /** Quick stats shown on overview tab */
  quickStats?: ProductFeature[];
  /** Call-to-action click handler */
  onRequestQuote?: () => void;
  /** Back navigation handler */
  onBack?: () => void;
  /** CTA label */
  ctaLabel?: string;
  /** Back label */
  backLabel?: string;
  /** Theme gradient classes */
  gradientClasses?: string;
  /** Glow accent color class */
  glowColor?: string;
}

// =========================================
// 2. ANIMATION VARIANTS
// =========================================

const ANIMATIONS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
    },
    exit: { opacity: 0, y: -10, filter: 'blur(5px)' },
  },
  image: (tabIdx: number): Variants => ({
    initial: {
      opacity: 0,
      scale: 1.4,
      filter: 'blur(12px)',
      rotate: tabIdx === 0 ? -15 : 15,
      x: tabIdx === 0 ? -60 : 60,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      rotate: 0,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
    },
    exit: {
      opacity: 0,
      scale: 0.7,
      filter: 'blur(16px)',
      transition: { duration: 0.25 },
    },
  }),
};

// =========================================
// 3. SUB-COMPONENTS
// =========================================

function BackgroundGradient({ gradient }: { gradient: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(120,119,198,0.06),transparent)]" />
    </div>
  );
}

function ProductVisual({
  image,
  fallbackImage,
  title,
  condition,
  conditionColor,
  glowColor,
  tabIdx,
}: {
  image: string;
  fallbackImage?: string;
  title: string;
  condition?: string;
  conditionColor?: string;
  glowColor: string;
  tabIdx: number;
}) {
  return (
    <div className="relative flex items-center justify-center py-6 md:py-10">
      {/* Animated rings */}
      <motion.div
        className="absolute w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full border border-neutral-200/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full border border-neutral-200/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Glow pulse */}
      <motion.div
        className={`absolute w-32 h-32 md:w-48 md:h-48 rounded-full ${glowColor} opacity-15 blur-3xl`}
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`img-${tabIdx}`}
          variants={ANIMATIONS.image(tabIdx)}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-2xl overflow-hidden shadow-xl shadow-neutral-300/50"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (fallbackImage) e.currentTarget.src = fallbackImage;
            }}
          />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Condition badge */}
      {condition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-20"
        >
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${conditionColor || 'bg-white/80 text-neutral-700 border border-neutral-200'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {condition}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ProductDetails({
  title,
  brand,
  description,
  sku,
  features,
  isFullSpec,
  category,
  quantity,
  location,
  price,
  onRequestQuote,
  ctaLabel,
}: {
  title: string;
  brand?: string;
  description?: string;
  sku?: string;
  features: ProductFeature[];
  isFullSpec?: boolean;
  category?: string;
  quantity?: number;
  location?: string;
  price?: string | null;
  onRequestQuote?: () => void;
  ctaLabel?: string;
}) {
  return (
    <motion.div
      variants={ANIMATIONS.container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-3 text-left"
    >
      {/* Brand badge */}
      {brand && (
        <motion.div variants={ANIMATIONS.item}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 border border-neutral-200">
            <Tag className="w-3 h-3" />
            {brand}
          </span>
        </motion.div>
      )}

      {/* Title */}
      <motion.h2
        variants={ANIMATIONS.item}
        className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-neutral-900 leading-tight"
      >
        {title}
      </motion.h2>

      {/* SKU */}
      {sku && !isFullSpec && (
        <motion.p variants={ANIMATIONS.item} className="text-xs text-neutral-400 flex items-center gap-1.5">
          <Hash className="w-3 h-3" />
          {sku}
        </motion.p>
      )}

      {/* Description — only on overview */}
      {description && !isFullSpec && (
        <motion.p variants={ANIMATIONS.item} className="text-sm text-neutral-500 leading-relaxed max-w-md">
          {description}
        </motion.p>
      )}

      {/* Feature display — grid for overview, list for full specs */}
      {!isFullSpec ? (
        /* Overview: compact grid cards */
        <motion.div variants={ANIMATIONS.item} className="grid grid-cols-2 gap-2.5 mt-1">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="relative rounded-xl bg-neutral-50 border border-neutral-200 p-3 overflow-hidden group hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${feat.progress != null && feat.progress > 50 ? 'text-neutral-700' : 'text-neutral-400'}`} />
                  <span className="text-xs text-neutral-500">{feat.label}</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{feat.value}</span>
                {feat.progress != null && (
                  <div className="mt-2 h-1 rounded-full bg-neutral-200 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${feat.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      ) : (
        /* Full Specs: detailed list */
        <motion.div
          variants={ANIMATIONS.item}
          className="mt-1 rounded-xl bg-neutral-50 border border-neutral-200 divide-y divide-neutral-100 max-h-[320px] overflow-y-auto scrollbar-hide"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 transition-colors">
                <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="text-xs text-neutral-500 w-24 shrink-0">{feat.label}</span>
                <span className="text-sm text-neutral-900 font-medium flex-1 truncate" title={feat.value}>{feat.value}</span>
                {feat.progress != null && (
                  <div className="w-16 h-1 rounded-full bg-neutral-200 overflow-hidden shrink-0">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${feat.progress}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Meta row: category, quantity, location — only on overview */}
      {!isFullSpec && (
        <motion.div variants={ANIMATIONS.item} className="flex flex-wrap gap-3 mt-1">
          {category && (
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Monitor className="w-3.5 h-3.5" /> {category}
            </span>
          )}
          {quantity != null && (
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Package className="w-3.5 h-3.5" /> {quantity} pcs
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <MapPin className="w-3.5 h-3.5" /> {location}
            </span>
          )}
        </motion.div>
      )}

      {/* Price + CTA */}
      <motion.div variants={ANIMATIONS.item} className="flex items-center gap-4 mt-2">
        {price !== undefined && (
          <div className="flex items-center gap-2">
            {price ? (
              <span className="text-lg font-bold text-neutral-900">{price}</span>
            ) : (
              <span className="text-sm text-neutral-400 italic">Price on request</span>
            )}
          </div>
        )}
        {onRequestQuote && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRequestQuote}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            {ctaLabel || 'Get Quote'}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

function TabSwitcher({
  active,
  onSwitch,
}: {
  active: ShowcaseTab;
  onSwitch: (tab: ShowcaseTab) => void;
}) {
  const tabs: { id: ShowcaseTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Full Specs' },
  ];

  return (
    <div className="flex justify-center mt-6">
      <div className="flex rounded-full bg-neutral-100 border border-neutral-200 p-1">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            whileTap={{ scale: 0.96 }}
            className="relative w-28 h-10 rounded-full flex items-center justify-center text-sm font-medium focus:outline-none"
          >
            {active === tab.id && (
              <motion.div
                layoutId="showcase-tab-indicator"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${active === tab.id ? 'text-neutral-900' : 'text-neutral-400'}`}>
              {tab.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// =========================================
// 4. MAIN COMPONENT
// =========================================

export default function ProductShowcase({
  title,
  brand,
  description,
  sku,
  image,
  fallbackImage,
  condition,
  conditionColor,
  category,
  quantity,
  location,
  price,
  features = [],
  quickStats = [],
  onRequestQuote,
  onBack,
  ctaLabel,
  backLabel,
  gradientClasses = 'from-slate-50 via-neutral-50 to-white',
  glowColor = 'bg-blue-300',
}: ProductShowcaseProps) {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('overview');

  const displayFeatures = activeTab === 'overview' ? quickStats : features;

  return (
    <div className="relative w-full min-h-[520px] md:min-h-[560px] rounded-3xl overflow-hidden bg-white border border-neutral-200 shadow-xl">
      <BackgroundGradient gradient={gradientClasses} />

      {/* Back button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          {backLabel || 'Back'}
        </motion.button>
      )}

      {/* Main layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-6 md:p-10 items-center">
        {/* Left: Product Visual */}
        <ProductVisual
          image={image}
          fallbackImage={fallbackImage}
          title={title}
          condition={condition}
          conditionColor={conditionColor}
          glowColor={glowColor}
          tabIdx={activeTab === 'overview' ? 0 : 1}
        />

        {/* Right: Content */}
        <AnimatePresence mode="wait">
          <ProductDetails
            key={activeTab}
            title={title}
            brand={brand}
            description={description}
            sku={sku}
            features={displayFeatures}
            isFullSpec={activeTab === 'specs'}
            category={category}
            quantity={quantity}
            location={location}
            price={price}
            onRequestQuote={onRequestQuote}
            ctaLabel={ctaLabel}
          />
        </AnimatePresence>
      </div>

      {/* Tab switcher */}
      {features.length > 0 && (
        <div className="relative z-10 pb-6">
          <TabSwitcher active={activeTab} onSwitch={setActiveTab} />
        </div>
      )}
    </div>
  );
}

// =========================================
// 5. HELPER: Build features from inventory/stock items
// =========================================

/**
 * Build quickStats (overview — top 3-4 cards) and full features (specs list)
 * from a StockItem. Includes all available fields.
 */
export function buildFeaturesFromStock(
  item: {
    processor?: string;
    ram?: string;
    video?: string;
    battery?: string;
  },
  extra?: {
    sku?: string;
    model?: string;
    brand?: string;
    category?: string;
    condition?: string;
    quantity?: number;
    location?: string;
    price?: string | null;
    updatedAt?: string;
  },
): { quickStats: ProductFeature[]; features: ProductFeature[] } {
  const quickStats: ProductFeature[] = [];
  const features: ProductFeature[] = [];

  // --- Quick stats (overview cards) ---
  if (item.processor) {
    quickStats.push({ label: 'Processor', value: item.processor, icon: Cpu });
  }
  if (item.ram) {
    const ramGb = parseInt(item.ram);
    quickStats.push({
      label: 'Memory',
      value: item.ram,
      icon: MemoryStick,
      progress: !isNaN(ramGb) ? Math.min(100, (ramGb / 64) * 100) : undefined,
    });
  }
  if (item.video) {
    quickStats.push({ label: 'Graphics', value: item.video, icon: Monitor });
  }
  if (item.battery) {
    const batteryNum = parseInt(item.battery);
    quickStats.push({
      label: 'Battery',
      value: item.battery,
      icon: Battery,
      progress: !isNaN(batteryNum) ? Math.min(100, batteryNum) : undefined,
    });
  }

  // --- Full specs (all known data) ---
  if (item.processor) features.push({ label: 'Processor', value: item.processor, icon: Cpu });
  if (item.ram) {
    const ramGb = parseInt(item.ram);
    features.push({
      label: 'RAM',
      value: item.ram,
      icon: MemoryStick,
      progress: !isNaN(ramGb) ? Math.min(100, (ramGb / 64) * 100) : undefined,
    });
  }
  if (item.video) features.push({ label: 'Graphics', value: item.video, icon: Monitor });
  if (item.battery) {
    const batteryNum = parseInt(item.battery);
    features.push({
      label: 'Battery',
      value: item.battery,
      icon: Battery,
      progress: !isNaN(batteryNum) ? Math.min(100, batteryNum) : undefined,
    });
  }

  // Extra fields for full spec list
  if (extra) {
    if (extra.brand) features.push({ label: 'Brand', value: extra.brand, icon: Tag });
    if (extra.category) features.push({ label: 'Category', value: extra.category, icon: Ruler });
    if (extra.condition) features.push({ label: 'Condition', value: extra.condition, icon: ShieldCheck });
    if (extra.sku) features.push({ label: 'SKU / Article', value: extra.sku, icon: Barcode });
    if (extra.quantity != null) features.push({ label: 'Quantity', value: `${extra.quantity} pcs`, icon: Package });
    if (extra.location) features.push({ label: 'Location', value: extra.location, icon: MapPin });
    if (extra.price) features.push({ label: 'Price', value: extra.price, icon: Hash });
    if (extra.updatedAt) {
      try {
        const d = new Date(extra.updatedAt);
        features.push({ label: 'Last Updated', value: d.toLocaleDateString('de-DE'), icon: Calendar });
      } catch { /* skip */ }
    }
  }

  return { quickStats: quickStats.slice(0, 4), features };
}

/**
 * Build quickStats and full features from an InventoryItem (marketplace detail page).
 */
export function buildFeaturesFromInventory(item: {
  description?: string;
  brand?: string;
  category?: string;
  condition?: string;
  inventoryNumber?: string;
  serialNumber?: string;
  sku?: string;
  processor?: string;
  ram_raw?: string;
  storage_raw?: string;
  gpu_raw?: string;
  year?: string;
  batteryCycles?: string;
  batteryHealth?: string;
  laptopRamGb?: number;
  laptopStorageGb?: number;
  laptopStorageType?: string;
  quantity?: number;
  location?: string;
  price?: number;
  notes?: string;
}): { quickStats: ProductFeature[]; features: ProductFeature[] } {
  const quickStats: ProductFeature[] = [];
  const features: ProductFeature[] = [];

  // --- Quick stats (overview) ---
  if (item.processor) {
    quickStats.push({ label: 'Processor', value: item.processor, icon: Cpu });
  }
  if (item.ram_raw || item.laptopRamGb) {
    const val = item.ram_raw || `${item.laptopRamGb} GB`;
    const gb = item.laptopRamGb || parseInt(item.ram_raw || '');
    quickStats.push({
      label: 'Memory',
      value: val,
      icon: MemoryStick,
      progress: !isNaN(gb) ? Math.min(100, (gb / 64) * 100) : undefined,
    });
  }
  if (item.gpu_raw) {
    quickStats.push({ label: 'Graphics', value: item.gpu_raw, icon: Monitor });
  }
  if (item.batteryHealth) {
    const num = parseInt(item.batteryHealth);
    quickStats.push({
      label: 'Battery',
      value: item.batteryHealth,
      icon: Battery,
      progress: !isNaN(num) ? Math.min(100, num) : undefined,
    });
  }

  // --- Full specs ---
  if (item.processor) features.push({ label: 'Processor', value: item.processor, icon: Cpu });
  if (item.ram_raw || item.laptopRamGb) {
    const val = item.ram_raw || `${item.laptopRamGb} GB`;
    const gb = item.laptopRamGb || parseInt(item.ram_raw || '');
    features.push({
      label: 'RAM',
      value: val,
      icon: MemoryStick,
      progress: !isNaN(gb) ? Math.min(100, (gb / 64) * 100) : undefined,
    });
  }
  if (item.storage_raw || item.laptopStorageGb) {
    const val = item.storage_raw || `${item.laptopStorageGb} GB${item.laptopStorageType ? ` ${item.laptopStorageType}` : ''}`;
    features.push({ label: 'Storage', value: val, icon: HardDrive });
  }
  if (item.gpu_raw) features.push({ label: 'Graphics', value: item.gpu_raw, icon: Monitor });
  if (item.year) features.push({ label: 'Year', value: item.year, icon: Calendar });
  if (item.batteryHealth) {
    const num = parseInt(item.batteryHealth);
    features.push({
      label: 'Battery Health',
      value: item.batteryHealth,
      icon: Battery,
      progress: !isNaN(num) ? Math.min(100, num) : undefined,
    });
  }
  if (item.batteryCycles) features.push({ label: 'Battery Cycles', value: `${item.batteryCycles} cycles`, icon: Zap });
  if (item.brand) features.push({ label: 'Brand', value: item.brand, icon: Tag });
  if (item.category) features.push({ label: 'Category', value: item.category, icon: Ruler });
  if (item.condition) features.push({ label: 'Condition', value: item.condition, icon: ShieldCheck });
  if (item.sku || item.inventoryNumber) features.push({ label: 'SKU / Article', value: (item.sku || item.inventoryNumber)!, icon: Barcode });
  if (item.serialNumber) features.push({ label: 'Serial Number', value: item.serialNumber, icon: Hash });
  if (item.quantity != null && item.quantity > 0) features.push({ label: 'Quantity', value: `${item.quantity} pcs`, icon: Package });
  if (item.location) features.push({ label: 'Location', value: item.location, icon: MapPin });
  if (item.price != null && item.price > 0) features.push({ label: 'Price', value: `${item.price.toLocaleString('de-DE')} €`, icon: Hash });
  if (item.notes) features.push({ label: 'Notes', value: item.notes, icon: FileText });

  return { quickStats: quickStats.slice(0, 4), features };
}
