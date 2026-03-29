export default function AdBanner({
  size = 'horizontal',
  className = '',
}: {
  size?: 'horizontal' | 'vertical' | 'leaderboard';
  className?: string;
}) {
  const sizeClasses = {
    horizontal: 'w-full h-24',
    vertical: 'w-48 h-96',
    leaderboard: 'w-full h-14',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100
        border border-stone-200 rounded-xl flex items-center justify-center
        relative overflow-hidden
        ${className}
      `}
    >
      {/* Simulated ad background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-purple-50" />
      </div>
      <div className="relative text-center px-6">
        <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Advertisement</span>
        <div className="mt-1 text-sm text-stone-500">Google AdSense / 百度联盟</div>
      </div>
    </div>
  );
}
