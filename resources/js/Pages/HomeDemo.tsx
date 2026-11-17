// resources/js/Pages/HomeDemo.tsx
// Renders your REAL Pages/Home.tsx (landing page) with random banners + categories.
import React from "react";
import Home from "./Home";
import { makeBanners, makeLandingCategories } from "@/utils/demoEventData";

export default function HomeDemo() {
  const categories = React.useMemo(() => makeLandingCategories(), []);
  const empty = { data: [], links: [], meta: {} } as any;
  return (
    <Home
      banners={makeBanners() as any}
      categories={categories as any}
      products={empty}
      allproducts={empty}
      categoryGroups={[]}
      productGroups={[]}
      departments={[]}
    />
  );
}
