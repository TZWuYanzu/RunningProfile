interface Props {
  nickname: string;
}

export default function AvatarCard({ nickname }: Props) {
  const initial = nickname.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 mx-5 mt-3 p-4">
      <div className="w-16 h-16 bg-invert flex items-center justify-center text-invert-text text-5xl font-black shrink-0 leading-none">
        {initial}
      </div>
      <div>
        <div className="text-base font-bold text-primary">{nickname}</div>
      </div>
    </div>
  );
}
