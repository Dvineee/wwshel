import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { WheelReward, WheelSpin } from '../types';
import { soundEngine } from '../lib/sound';
import { Disc, Sparkles, Trophy, Clock, ShieldCheck, AlertCircle, Flame, Gift, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

export const WheelPage: React.FC = () => {
  const { wheelRewards } = useData();
  const { user, refreshProfile } = useAuth();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);
  const [spinsHistory, setSpinsHistory] = useState<WheelSpin[]>([]);
  const [alreadySpunToday, setAlreadySpunToday] = useState(false);

  const activeRewards = wheelRewards.filter((r) => r.active);

  // 7-day login streak calculation
  const streakDays = [
    { day: 1, reward: '50 Coin', claimed: true },
    { day: 2, reward: '100 Coin', claimed: true },
    { day: 3, reward: '150 Coin', claimed: !alreadySpunToday, current: true },
    { day: 4, reward: '200 Coin', claimed: false },
    { day: 5, reward: '300 Coin', claimed: false },
    { day: 6, reward: '500 Coin', claimed: false },
    { day: 7, reward: '1000 VIP + Sandık', claimed: false, vip: true },
  ];

  const loadHistory = async () => {
    const history = await db.getWheelSpins();
    setSpinsHistory(history);
    if (user) {
      const today = new Date().toDateString();
      const userTodaySpin = history.find(
        (s) => s.user_id === user.id && new Date(s.created_at).toDateString() === today
      );
      setAlreadySpunToday(Boolean(userTodaySpin));
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleSpin = async () => {
    soundEngine.playClick();
    if (!user) {
      toast.error('Çarkı çevirebilmek için lütfen giriş yapınız.');
      return;
    }
    if (alreadySpunToday) {
      toast.error('Bugünkü çark çevirme hakkınızı kullandınız. Yarın tekrar bekleriz!');
      return;
    }
    if (spinning || activeRewards.length === 0) return;

    setSpinning(true);
    setWonReward(null);

    try {
      const result = await db.spinWheel(user.id, user.username);
      if (!result.success) {
        toast.error(result.message || 'Çark çevrilemedi');
        setSpinning(false);
        return;
      }

      const reward = result.reward;
      const rewardIndex = activeRewards.findIndex((r) => r.id === reward.id);
      const segmentAngle = 360 / activeRewards.length;
      // Target angle to center the winning slice under the top pointer
      const targetSegmentCenter = rewardIndex * segmentAngle + segmentAngle / 2;
      const extraSpins = 360 * 6; // 6 full fast rotations
      const finalRotation = rotation + extraSpins + (360 - targetSegmentCenter);

      setRotation(finalRotation);

      // Realistic audio ticking simulation as wheel slows down
      let tickDelay = 60;
      let tickCount = 0;
      const maxTicks = 32;

      const scheduleTick = () => {
        if (tickCount < maxTicks) {
          soundEngine.playWheelTick(1 + tickCount * 0.02);
          tickCount++;
          tickDelay = Math.floor(tickDelay * 1.09);
          setTimeout(scheduleTick, tickDelay);
        }
      };
      setTimeout(scheduleTick, 100);

      setTimeout(async () => {
        setSpinning(false);
        setWonReward(reward);
        setAlreadySpunToday(true);
        await refreshProfile();
        await loadHistory();

        soundEngine.playWin();
        soundEngine.playCoin();

        // Celebration Confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#A855F7', '#F59E0B', '#10B981', '#EC4899'],
        });

        if (reward.reward_type === 'coin') {
          toast.success(`Tebrikler! +${reward.reward_value} Coin kazandınız!`);
        } else {
          toast.success(`Tebrikler! ${reward.title} kazandınız!`);
        }
      }, 4800);
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu');
      setSpinning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          HER GÜN ÜCRETSİZ 1 ŞANS & GÜNLÜK SERİ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Günlük VIP Şans Çarkı
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Her gün giriş yap, çarkı çevir, günlük seriyi bozma ve mağazada gerçek dijital kodlara dönüştürebileceğin binlerce coin topla!
        </p>
      </div>

      {/* 7-Day Login Streak Row */}
      <div className="p-5 rounded-3xl bg-[#120b24] border border-violet-800/30 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
            <h3 className="text-sm font-bold text-white">7 Günlük Giriş Serisi Bonusu</h3>
          </div>
          <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            3 Gün Aktif Seri 🔥
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {streakDays.map((item) => (
            <div
              key={item.day}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                item.claimed
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : item.current
                  ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20 text-white animate-pulse'
                  : item.vip
                  ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                  : 'bg-violet-950/20 border-violet-900/30 text-slate-400'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.day}. Gün</span>
              <div className="my-1.5 flex items-center justify-center">
                {item.claimed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : item.vip ? (
                  <Trophy className="w-5 h-5 text-amber-400" />
                ) : (
                  <Gift className="w-5 h-5 text-violet-400" />
                )}
              </div>
              <span className="text-xs font-black truncate w-full">{item.reward}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Wheel Canvas/SVG (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#0d0918] border border-violet-800/30 shadow-2xl relative">
          {/* Top Indicator Arrow */}
          <div className="absolute top-3 z-30 flex flex-col items-center drop-shadow-2xl">
            <div className="w-8 h-9 bg-gradient-to-b from-amber-300 to-amber-500 clip-triangle shadow-2xl rotate-180" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>

          {/* Wheel Container */}
          <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] my-6">
            {/* Outer LED Glowing Rim */}
            <div className="absolute -inset-3 rounded-full border-4 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '30s' }} />

            <div
              className="w-full h-full rounded-full border-8 border-violet-800/80 shadow-[0_0_60px_rgba(124,58,237,0.5)] relative overflow-hidden transition-transform ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '4.8s' : '0s',
                transitionTimingFunction: 'cubic-bezier(0.12, 0.95, 0.22, 1)',
              }}
            >
              {/* SVG Slices */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {activeRewards.map((reward, i) => {
                  const num = activeRewards.length;
                  const angle = 360 / num;
                  const startAngle = i * angle;
                  const endAngle = (i + 1) * angle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Slice Colors
                  const colors = ['#7C3AED', '#9333EA', '#6D28D9', '#C026D3', '#EAB308', '#475569', '#DB2777', '#8B5CF6'];
                  const fillColor = reward.color || colors[i % colors.length];

                  return (
                    <g key={reward.id}>
                      <path d={pathData} fill={fillColor} stroke="#070510" strokeWidth="0.9" />
                    </g>
                  );
                })}
              </svg>

              {/* Labels on Slices */}
              {activeRewards.map((reward, i) => {
                const angle = 360 / activeRewards.length;
                const midAngle = i * angle + angle / 2;
                return (
                  <div
                    key={reward.id}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-black text-white pointer-events-none drop-shadow-md text-center"
                    style={{
                      transform: `rotate(${midAngle}deg) translate(0, -95px) rotate(-${midAngle}deg)`,
                      width: '64px',
                    }}
                  >
                    {reward.title}
                  </div>
                );
              })}
            </div>

            {/* Center Golden Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500 border-4 border-[#0d0918] flex items-center justify-center shadow-2xl z-20 cursor-pointer" onClick={handleSpin}>
              <Disc className="w-7 h-7 text-violet-950 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          {/* Spin Button */}
          <div className="w-full max-w-sm mt-4">
            <button
              onClick={handleSpin}
              disabled={spinning || alreadySpunToday}
              className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 ${
                alreadySpunToday
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/60 hover:scale-105 active:scale-95'
              }`}
            >
              <Disc className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>
                {spinning
                  ? 'ÇARK DÖNÜYOR...'
                  : alreadySpunToday
                  ? 'BUGÜNKÜ HAK KULLANILDI'
                  : 'ŞANS ÇARKINI ÇEVİR'}
              </span>
            </button>
            {alreadySpunToday && (
              <p className="text-center text-xs text-amber-400/90 mt-2 font-medium">
                ⏳ Bir sonraki çark hakkınız yarın 00:00'da yenilenecektir.
              </p>
            )}
          </div>
        </div>

        {/* Right: Won Rewards & Live Winners Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Won Reward Alert Card */}
          {wonReward && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-purple-900/30 to-[#120b24] border-2 border-amber-400/50 shadow-2xl animate-in zoom-in-95 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-400 text-violet-950 flex items-center justify-center mx-auto mb-2 font-black shadow-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">TEBRİKLER!</h3>
              <p className="text-sm font-bold text-amber-300 mt-1">{wonReward.title}</p>
              <p className="text-xs text-slate-300 mt-2">
                Ödülünüz hesabınıza tanımlandı. Coinlerinizi mağazada harcayabilirsiniz.
              </p>
            </div>
          )}

          {/* Recent Winners History Card */}
          <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Canlı Çark Kazananları
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {spinsHistory.slice(0, 10).map((spin) => (
                <div
                  key={spin.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-violet-950/40 border border-violet-900/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-700/40 text-violet-200 flex items-center justify-center font-bold text-[10px]">
                      {spin.username?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{spin.username}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(spin.created_at)}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-amber-300">{spin.reward_title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RewardWheelPage = WheelPage;

