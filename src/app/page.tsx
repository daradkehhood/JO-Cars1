import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCars } from '@/components/home/FeaturedCars';
import { LatestCars } from '@/components/home/LatestCars';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCars />
      <LatestCars />
    </>
  );
}
