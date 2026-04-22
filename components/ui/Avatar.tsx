import Image from "next/image";

interface AvatarProps {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

const pxSizes = { sm: 32, md: 40, lg: 64, xl: 96 };

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
        <Image
          src={src}
          alt={name}
          width={pxSizes[size]}
          height={pxSizes[size]}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
