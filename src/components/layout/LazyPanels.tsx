"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useUI, type Panel } from "@/components/providers/AppProviders";

// Drawers are not needed for first paint: load each one the first time it is opened (P3, TBT).
const MobileMenu = dynamic(() => import("./MobileMenu").then((m) => m.MobileMenu), { ssr: false });
const SearchOverlay = dynamic(() => import("./SearchOverlay").then((m) => m.SearchOverlay), { ssr: false });
const MiniCart = dynamic(() => import("@/components/cart/MiniCart").then((m) => m.MiniCart), { ssr: false });

export function LazyPanels() {
  const { panel } = useUI();
  const [seen, setSeen] = useState<Set<Exclude<Panel, null>>>(() => new Set());

  // Derive-during-render: record a newly opened panel (no effect needed).
  if (panel && panel !== "cookies" && !seen.has(panel)) {
    setSeen(new Set(seen).add(panel));
  }

  return (
    <>
      {seen.has("menu") && <MobileMenu />}
      {seen.has("search") && <SearchOverlay />}
      {seen.has("cart") && <MiniCart />}
    </>
  );
}
