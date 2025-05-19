interface MyImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

export default function MyImage({
  src,
  alt,
  className,
  fill,
  priority,
}: MyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      style={fill ? { objectFit: 'cover' } : undefined}
    />
  );
}