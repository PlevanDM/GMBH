/**
 * Справочники NEXX — перенесённые данные из NEXX-LAST (модели, цены, PMIC, зарядные станции).
 * Блок цен підключено до великих європейських маркетів: Idealo, Geizhals, Google Shopping, Amazon DE.
 */
import { useState } from 'react'
import { NEXX_POWER_STATIONS, type NexxPowerStation } from '../../data/nexxPowerStations'
import { NEXX_PMIC_REFERENCE } from '../../data/nexxPmicReference'
import {
  getProductSearchQuery,
  getMarketplaceLinks,
} from '../../utils/marketplaceUrls'

const TABS = [
  { id: 'power', label: 'Зарядні станції та ціни' },
  { id: 'pmic', label: 'Apple PMIC (мікросхеми)' },
  { id: 'about', label: 'Про базу NEXX' },
] as const

export default function ReferencesNexx() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('power')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'power' && <PowerStationsTab />}
      {tab === 'pmic' && <PmicTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  )
}

function PowerStationsTab() {
  const byCategory = NEXX_POWER_STATIONS.reduce<Record<string, NexxPowerStation[]>>((acc, item) => {
    const c = item.category || 'Other'
    if (!acc[c]) acc[c] = []
    acc[c].push(item)
    return acc
  }, {})
  const categories = Object.keys(byCategory).sort()

  return (
    <div className="space-y-6">
      <p className="text-neutral-600 text-sm">
        Ціни на зарядні станції та аксесуари (EcoFlow, BLUETTI, DJI, Jackery). Орієнтовні € з{' '}
        <a href="https://github.com/PlevanDM/NEXX-LAST" target="_blank" rel="noopener noreferrer" className="text-primary underline">NEXX-LAST</a>.
        Актуальні ціни по моделях можна переглянути на великих європейських маркетах — використовуйте кнопки «Ціни на ринку».
      </p>
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">{cat}</h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Бренд</th>
                  <th className="px-4 py-2 text-left font-medium">Назва / модель</th>
                  <th className="px-4 py-2 text-right font-medium">€ (орієнт.)</th>
                  <th className="px-4 py-2 text-left font-medium">Наші пропозиції</th>
                  <th className="px-4 py-2 text-left font-medium">Ціни на ринку Європи</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {byCategory[cat].map((row) => {
                  const searchQuery = getProductSearchQuery(row.brand, row.name, row.model)
                  const marketLinks = getMarketplaceLinks(searchQuery)
                  return (
                    <tr key={row.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-2 font-medium">{row.brand}</td>
                      <td className="px-4 py-2">
                        {row.name}
                        {row.specs && <span className="text-neutral-500 block text-xs">{row.specs}</span>}
                      </td>
                      <td className="px-4 py-2 text-right">{row.price_eu} €</td>
                      <td className="px-4 py-2">
                        <ul className="space-y-0.5">
                          {row.offers.slice(0, 3).map((o, i) => (
                            <li key={i} className="text-neutral-600">
                              {o.supplier}: {o.price} {o.currency}
                              {o.note && <span className="text-neutral-400"> ({o.note})</span>}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {marketLinks.map((m) => (
                            <a
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-accent hover:text-white hover:border-accent transition-colors"
                              title={`Переглянути ціни на ${m.label}`}
                            >
                              {m.label}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}

function PmicTab() {
  const series = Object.keys(NEXX_PMIC_REFERENCE.pmicBySeries).sort().reverse()
  const symptoms = Object.entries(NEXX_PMIC_REFERENCE.diagnosticSymptoms)

  return (
    <div className="space-y-8">
      <p className="text-neutral-600 text-sm">
        Справочник PMIC та мікросхем Apple iPhone. Оновлено: {NEXX_PMIC_REFERENCE.lastUpdated}.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">PMIC по серіях</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Серія</th>
                <th className="px-4 py-2 text-left font-medium">Main PMIC</th>
                <th className="px-4 py-2 text-left font-medium">Інше (charging, audio)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {series.map((s) => {
                const p = NEXX_PMIC_REFERENCE.pmicBySeries[s]
                const rest = [
                  p.charging,
                  p.chargingBoost,
                  p.wirelessCharging,
                  p.audioCodec,
                  p.audioAmp,
                  p.secondary?.join(', '),
                ].filter(Boolean)
                return (
                  <tr key={s} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 font-medium">{s}</td>
                    <td className="px-4 py-2">{p.main}</td>
                    <td className="px-4 py-2 text-neutral-600">{rest.join(' · ') || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">Діагностика (симптом → перевірка)</h2>
        <ul className="space-y-2 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
          {symptoms.map(([key, value]) => (
            <li key={key}>
              <span className="font-medium text-neutral-800">{key}:</span>{' '}
              <span className="text-neutral-600">{value}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="prose prose-neutral max-w-none space-y-4">
      <p>
        База знань та довідники перенесені з проекту{' '}
        <a href="https://github.com/PlevanDM/NEXX-LAST" target="_blank" rel="noopener noreferrer">
          NEXX-LAST
        </a>{' '}
        (NEXX GSM Service Center — сервісний центр Apple).
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Зарядні станції</strong> — ціни та пропозиції (EcoFlow, BLUETTI, DJI, Jackery) вже підключені в цьому розділі.
        </li>
        <li>
          <strong>Apple PMIC</strong> — довідник мікросхем iPhone (338Sxxxx, Charging, Audio) підключений вище.
        </li>
        <li>
          <strong>Повна база NEXX</strong> (134 пристрої, 167 кодів помилок, 115+ IC, гайди, діодні вимірювання) знаходиться у репозиторії в <code>public/data/</code>:{' '}
          <code>master-db.json</code>, <code>*-ic-reference.json</code>, тощо. Щоб використовувати їх тут, скопіюйте папку <code>public/data</code> з клону NEXX-LAST у <code>public/nexx</code> цього проекту — тоді можна буде додати сторінку «База пристроїв» з пошуком і фільтрами.
        </li>
      </ul>
      <p className="text-sm text-neutral-500">
        PIN доступу до бази на nexxgsm.com: 31618585. У цьому проєкті довідники відкриті в розділі Інструменти.
      </p>
    </div>
  )
}
