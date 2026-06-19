export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 rounded-full bg-current opacity-50 animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-current opacity-70 animate-pulse [animation-delay:120ms]" />
      <span className="w-2 h-2 rounded-full bg-current opacity-90 animate-pulse [animation-delay:240ms]" />
    </div>
  );
};
