import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCars } from '@/components/home/FeaturedCars';
import { LatestCars } from '@/components/home/LatestCars';
import { BrandsSection } from '@/components/home/BrandsSection';
import { CitiesSection } from '@/components/home/CitiesSection';
import { PriceRanges } from '@/components/home/PriceRanges';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCars />
      <LatestCars />
      <BrandsSection />
      <CitiesSection />
      <PriceRanges />
    </>
  );
}
