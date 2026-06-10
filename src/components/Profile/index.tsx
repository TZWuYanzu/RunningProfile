import { useState, useEffect, useCallback } from 'react';
import { getProfile, getShoes, createShoe, getShoeDetail, getHealthDaily } from '@/api/profile';
import { getPlans } from '@/api/calendar';
import type { AthleteProfile, RacePlan, Shoe, DailyHealthRecord } from '@/types/coach';
import AvatarCard from './AvatarCard';
import HealthCard from './HealthCard';
import RadarChart from './RadarChart';
import RaceCard from './RaceCard';
import ShoeList from './ShoeList';
import AddShoeForm from './AddShoeForm';
import ShoeDetail from './ShoeDetail';

export default function Profile() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [racePlans, setRacePlans] = useState<RacePlan[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [latestOverall, setLatestOverall] = useState<Record<number, string>>({});
  const [healthRecord, setHealthRecord] = useState<DailyHealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddShoe, setShowAddShoe] = useState(false);
  const [selectedShoe, setSelectedShoe] = useState<Shoe | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, plansRes, shoesRes, healthRes] = await Promise.all([
        getProfile().catch(() => ({ profile: null, summary: '' })),
        getPlans().catch(() => ({ plans: [] })),
        getShoes().catch(() => ({ shoes: [] })),
        getHealthDaily().catch(() => ({ records: [] })),
      ]);
      setProfile(profileRes.profile);
      setRacePlans(plansRes.plans);
      setShoes(shoesRes.shoes);
      if (healthRes.records.length > 0) {
        setHealthRecord(healthRes.records[healthRes.records.length - 1]);
      }

      const overalls: Record<number, string> = {};
      for (const shoe of shoesRes.shoes) {
        try {
          const detail = await getShoeDetail(shoe.id);
          if (detail.logs.length > 0) {
            overalls[shoe.id] = detail.logs[0].overall;
          }
        } catch {}
      }
      setLatestOverall(overalls);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddShoe = async (data: { name: string; brand: string; usage: string; traits: string[]; initial_km: number }) => {
    await createShoe(data);
    setShowAddShoe(false);
    loadData();
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-tertiary">加载中...</div>;
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      <AvatarCard nickname="糯金" />

      {healthRecord && <HealthCard record={healthRecord} />}

      {profile && <RadarChart profile={profile} />}
      {!profile && (
        <div className="mx-5 mt-3 p-4 bg-surface text-center text-sm text-tertiary">
          暂无能力数据
        </div>
      )}

      <RaceCard plans={racePlans} />

      <ShoeList
        shoes={shoes}
        latestOverall={latestOverall}
        onAdd={() => setShowAddShoe(true)}
        onSelect={setSelectedShoe}
      />

      {showAddShoe && (
        <AddShoeForm onSubmit={handleAddShoe} onClose={() => setShowAddShoe(false)} />
      )}

      {selectedShoe && (
        <ShoeDetail
          shoe={selectedShoe}
          onClose={() => setSelectedShoe(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
