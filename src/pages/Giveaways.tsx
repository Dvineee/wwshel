import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatTimeLeft, formatDate } from '../lib/utils';
import { Gift, Clock, Users, Trophy, CheckCircle, Sparkles, Crown, Award } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const GiveawaysPage: React.FC = () => {
  const { giveaways, refreshAll } = useData();
  const { user } = useAuth();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = async (giveawayId: string) => {
    if (!user) {
      toast.error('Çekilişe katılabilmek için lütfen giriş yapınız.');
      return;
    }
    setJoiningId(giveawayId);
    try {
      const res = await db.enterGiveaway(giveawayId, user.id, user.username);
      if (res.success) {
        toast.success(res.message);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
        await refreshAll();
      } else {
        toast.info(res.message);
      }
    } catch {
      toast.error('Çekilişe katılırken bir hata oluştu');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-rose-950/60 via-[#120b24] to-[#070510] border border-rose-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-3">
          <Gift className="w-3.5 h-3.5 text-rose-400" />
          ÖDÜLLÜ TOPLULUK ETKİNLİKLERİ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Büyük Topluluk Çekilişleri
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Tüm üyelerimize açık, doğrulanmış ve tamamen ücretsiz çekilişlerimize katılarak nakit ödüller kazanın.
        </p>
      </div>

      {/* Giveaways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {giveaways.map((giveaway) => (
          <div
            key={giveaway.id}
            className={`rounded-3xl bg-[#120b24] border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group ${
              giveaway.is_completed
                ? 'border-amber-500/40 hover:border-amber-400 shadow-amber-950/20'
                : 'border-violet-800/30 hover:border-violet-600/50 hover:shadow-violet-900/30'
            }`}
          >
            {/* Image & Countdown / Status Badge */}
            <div className="relative h-48 w-full overflow-hidden bg-violet-950/40">
              <img
                src={giveaway.image_url}
                alt={giveaway.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Top status badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950/80 border border-purple-500/40 text-purple-200 backdrop-blur-md flex items-center gap-1 shadow-md">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>{giveaway.winner_count || 1} Kazanan</span>
                </span>
              </div>

              {giveaway.is_completed ? (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-violet-950 text-xs font-black flex items-center gap-1.5 shadow-xl shadow-black/60">
                  <Crown className="w-3.5 h-3.5" />
                  <span>SONUÇLANDI</span>
                </div>
              ) : (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatTimeLeft(giveaway.end_at)}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                {giveaway.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {giveaway.description}
              </p>

              {/* Prize Details Box */}
              {giveaway.prize_details && (
                <div className="my-3 p-3 rounded-xl bg-violet-950/40 border border-violet-900/40 text-xs flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-200 font-semibold truncate">
                    {giveaway.prize_details}
                  </span>
                </div>
              )}

              {/* Winner Showcase Badge */}
              {giveaway.is_completed && giveaway.winner_username && (
                <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-violet-950/40 border border-amber-500/40 shadow-inner space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>KAZANANLAR:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {giveaway.winner_username.split(',').map((wName, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-violet-950 font-black text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        @{wName.trim().replace(/^@/, '')}
                      </span>
                    ))}
                  </div>
                  {giveaway.winner_note && (
                    <p className="text-[11px] text-slate-300 italic pl-1">
                      "{giveaway.winner_note}"
                    </p>
                  )}
                </div>
              )}

              {/* Footer Stats & CTA */}
              <div className="mt-auto pt-4 border-t border-violet-900/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span>{giveaway.entries_count || 0} Katılımcı</span>
                </div>

                {giveaway.is_completed ? (
                  <div className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Çekiliş Tamamlandı</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(giveaway.id)}
                    disabled={joiningId === giveaway.id}
                    className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 shadow-md shadow-pink-900/40 hover:scale-105 transition-all cursor-pointer"
                  >
                    {joiningId === giveaway.id ? 'Katılınıyor...' : 'Çekilişe Katıl'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
