import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { WheelReward } from '../../types';
import { Disc, Plus, Edit2, Trash2, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const WheelManager: React.FC = () => {
  const { wheelRewards, refreshAll } = useData();

  const [editingReward, setEditingReward] = useState<Partial<WheelReward> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [title, setTitle] = useState('');
  const [rewardType, setRewardType] = useState<'coin' | 'code' | 'bonus'>('coin');
  const [rewardValue, setRewardValue] = useState(100);
  const [probability, setProbability] = useState(15);
  const [color, setColor] = useState('#7C3AED');
  const [active, setActive] = useState(true);

  const openNew = () => {
    setIsNew(true);
    setEditingReward({});
    setTitle('150 Coin');
    setRewardType('coin');
    setRewardValue(150);
    setProbability(15);
    setColor('#8B5CF6');
    setActive(true);
  };

  const openEdit = (r: WheelReward) => {
    setIsNew(false);
    setEditingReward(r);
    setTitle(r.title);
    setRewardType(r.reward_type);
    setRewardValue(r.reward_value);
    setProbability(r.probability);
    setColor(r.color);
    setActive(r.active);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<WheelReward> = {
      title,
      reward_type: rewardType,
      reward_value: Number(rewardValue),
      probability: Number(probability),
      color,
      active,
    };

    try {
      if (isNew) {
        await db.createWheelReward(data as any);
        toast.success('Yeni çark ödülü eklendi!');
      } else if (editingReward?.id) {
        await db.updateWheelReward(editingReward.id, data);
        toast.success('Çark ödülü güncellendi!');
      }
      setEditingReward(null);
      await refreshAll();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" ödül dilimini silmek istediğinizden emin misiniz?`)) {
      await db.deleteWheelReward(id);
      toast.success('Ödül dilimi silindi');
      await refreshAll();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Şans Çarkı Ödül Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Çark dilimlerini, ödül tutarlarını, dilim renklerini ve kazanma olasılıklarını (%) ayarlayın.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ödül Dilimi Ekle</span>
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {wheelRewards.map((reward) => (
          <div
            key={reward.id}
            className="p-5 rounded-3xl bg-[#120b24] border border-violet-800/30 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                  style={{ backgroundColor: reward.color }}
                />
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {reward.title}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                %{reward.probability} Şans
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-900/30 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ödül Değeri</span>
              <p className="text-base font-black text-amber-300">
                {reward.reward_type === 'coin' ? `+${reward.reward_value} Coin` : reward.title}
              </p>
            </div>

            <div className="pt-2 border-t border-violet-900/30 flex items-center justify-between">
              <span
                className={`text-[10px] font-bold ${
                  reward.active ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {reward.active ? '● Çarkta Aktif' : '○ Pasif'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(reward)}
                  className="p-1.5 rounded-lg bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(reward.id, reward.title)}
                  className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNew ? 'Yeni Çark Ödülü Ekle' : 'Çark Ödülünü Düzenle'}
              </h3>
              <button onClick={() => setEditingReward(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ödül Başlığı *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ödül Tipi</label>
                  <select
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  >
                    <option value="coin">Coin Bakiyesi</option>
                    <option value="bonus">Özel Bonus</option>
                    <option value="code">Hediye Kodu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ödül Miktarı</label>
                  <input
                    type="number"
                    value={rewardValue}
                    onChange={(e) => setRewardValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kazanma İhtimali (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dilim Rengi</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 rounded-xl bg-[#0d0918] border border-violet-800/40 cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Çarkta Göster (Aktif)
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
