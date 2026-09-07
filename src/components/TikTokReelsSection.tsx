import React, { useState } from 'react';
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  PlusCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Flame
} from 'lucide-react';
import { TikTokReel } from '../types';

interface TikTokReelsSectionProps {
  reels: TikTokReel[];
  onAddReelPrompt: () => void;
  onOpenStudioRecorder?: () => void;
}

export const TikTokReelsSection: React.FC<TikTokReelsSectionProps> = ({
  reels,
  onAddReelPrompt,
  onOpenStudioRecorder
}) => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  const currentReel = reels[activeReelIndex] || reels[0];

  const handleLike = (id: string, initialLikes: number) => {
    const isLiked = !!isLikedMap[id];
    setIsLikedMap(prev => ({ ...prev, [id]: !isLiked }));
    setLikesMap(prev => ({
      ...prev,
      [id]: (prev[id] ?? initialLikes) + (isLiked ? -1 : 1)
    }));
  };

  const handleShare = () => {
    const shareTarget = currentReel?.videoUrl || window.location.href;
    navigator.clipboard?.writeText(shareTarget);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section className="py-6 px-3 sm:px-6 max-w-5xl mx-auto" id="tiktok-reels-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold text-xs uppercase tracking-widest">
            <i className="fa-brands fa-tiktok text-cyan-400"></i>
            <span>Lights Out Tattoo Live Feeds</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
            TIKTOK <span className="text-cyan-400">REELS & VIDEO FEED</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
            Behind the machine in Winchester, VA. In-progress needles, fresh ink reveals, and cover-up magic.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenStudioRecorder && (
            <button
              onClick={onOpenStudioRecorder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-purple-950/90 border border-rose-500/60 text-rose-200 text-xs font-mono font-bold hover:bg-rose-900/80 transition shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Studio Recorder (REC)</span>
            </button>
          )}
          <a
            href="https://www.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900/80 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>@lightsouttattoo</span>
          </a>
          <button
            onClick={onAddReelPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/70 border border-blue-400/40 text-blue-300 text-xs font-mono font-bold hover:bg-blue-900/80 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Reel (Admin)</span>
          </button>
        </div>
      </div>

      {/* Main Reels Theater / Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Featured Reel Player (Portrait Aspect Ratio) - 7 cols */}
        <div className="md:col-span-7 flex justify-center">
          {currentReel && (
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] rounded-2xl bg-black border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col justify-between p-4 group">
              {/* Background poster/image representing the reel */}
              <img
                src={currentReel.thumbnailUrl}
                alt={currentReel.caption}
                className="absolute inset-0 w-full h-full object-cover filter contrast-110 brightness-90 group-hover:scale-105 transition-transform duration-700"
              />

              {/* Gradient Overlay for Controls Readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

              {/* Top Reel Info */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center">
                    <i className="fa-brands fa-tiktok text-cyan-300 text-xs"></i>
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs text-white">@tex_lightsout</div>
                    <div className="text-[10px] font-mono text-cyan-300">Winchester, VA</div>
                  </div>
                </div>

                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/60 border border-cyan-500/40 text-cyan-300">
                  {currentReel.duration}
                </span>
              </div>

              {/* Center Play Overlay Icon / Watch link */}
              <div className="relative z-10 flex items-center justify-center my-auto">
                <a
                  href={currentReel.videoUrl || currentReel.tiktokUrl || 'https://www.tiktok.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-cyan-500/30 border-2 border-cyan-300 backdrop-blur-sm flex items-center justify-center text-cyan-200 shadow-[0_0_25px_#00f0ff] hover:scale-110 transition-transform group/play"
                  title="Watch on TikTok"
                >
                  <Play className="w-8 h-8 fill-current ml-1 text-cyan-200 group-hover/play:text-white" />
                </a>
              </div>

              {/* Right Vertical Action Rail (TikTok Style) */}
              <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
                {/* Like Button */}
                <button
                  onClick={() =>
                    handleLike(
                      currentReel.id,
                      currentReel.likes
                    )
                  }
                  className="flex flex-col items-center group/btn"
                >
                  <div
                    className={`p-2.5 rounded-full backdrop-blur-md border transition ${
                      isLikedMap[currentReel.id]
                        ? 'bg-rose-600/80 border-rose-400 text-white'
                        : 'bg-black/60 border-gray-700 text-gray-200 group-hover/btn:border-cyan-400'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isLikedMap[currentReel.id] ? 'fill-current' : ''
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white font-bold mt-1">
                    {likesMap[currentReel.id] ?? currentReel.likes}
                  </span>
                </button>

                {/* Comment Counter */}
                <div className="flex flex-col items-center">
                  <div className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-gray-700 text-gray-200">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-white font-bold mt-1">
                    {currentReel.comments}
                  </span>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  title="Copy video link"
                  className={`p-2.5 rounded-full backdrop-blur-md border transition ${
                    copiedLink
                      ? 'bg-emerald-600/90 border-emerald-400 text-white'
                      : 'bg-black/60 border-gray-700 text-gray-200 hover:border-cyan-400'
                  }`}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Reel Caption & Sound Strip */}
              <div className="relative z-10 pr-12 text-left">
                <h4 className="font-heading font-bold text-sm text-white line-clamp-1">
                  {currentReel.title}
                </h4>
                <p className="text-xs text-gray-200 mt-1 line-clamp-2">
                  {currentReel.caption}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {currentReel.hashtags.map(t => (
                    <span key={t} className="text-[10px] font-mono text-cyan-300">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Sound Track */}
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-gray-300 bg-black/50 px-2 py-1 rounded-lg w-fit border border-gray-800">
                  <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{currentReel.soundTitle}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reel Selector Playlist & Thumbnails - 5 cols */}
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 text-xs font-mono text-gray-400">
            <span>EXPLORE STUDIO CLIPS</span>
            <span>{reels.length} VIDEOS</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {reels.map((reel, idx) => {
              const isSelected = activeReelIndex === idx;
              return (
                <div
                  key={reel.id}
                  onClick={() => setActiveReelIndex(idx)}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#09152b] border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-[#080d1a] border-cyan-500/20 hover:border-cyan-500/50'
                  }`}
                >
                  {/* Small 9:16 thumbnail */}
                  <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-cyan-500/40">
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-cyan-300" />
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs text-white truncate">
                        {reel.title}
                      </span>
                      <span className="font-mono text-[10px] text-cyan-400 shrink-0">
                        {reel.duration}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                      {reel.caption}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400" />
                        <span>{reel.likes}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-cyan-400" />
                        <span>{reel.comments}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
