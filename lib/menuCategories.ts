import React from "react";
import {
  LuCoffee,
  LuCookie,
  LuCroissant,
  LuCupSoda,
  LuEgg,
  LuSalad,
  LuSandwich,
  LuUtensils,
} from "react-icons/lu";
import { FiGrid } from "react-icons/fi";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

export type DishCategory =
  | "All"
  | "Foul & Falafel"
  | "Sandwiches & Wraps"
  | "Eggs & Omelets"
  | "Bakery & Pastries"
  | "Beverages & Drinks"
  | "Sides & Salads"
  | "Other Dishes";

/**
 * Frontend-only helper to assign a semantic category based on dish name.
 * Does NOT alter or send anything to the backend.
 */
export function getDishCategory(name: string): DishCategory {
  const lower = name.toLowerCase().trim();

  // Beverages & Drinks
  if (
    lower.includes("coffee") ||
    lower.includes("tea") ||
    lower.includes("chai") ||
    lower.includes("latte") ||
    lower.includes("espresso") ||
    lower.includes("cappuccino") ||
    lower.includes("juice") ||
    lower.includes("drink") ||
    lower.includes("soda") ||
    lower.includes("pepsi") ||
    lower.includes("cola") ||
    lower.includes("smoothie") ||
    lower.includes("water") ||
    lower.includes("beverage") ||
    lower.includes("nescafe")
  ) {
    return "Beverages & Drinks";
  }

  // Foul & Falafel / Traditional Egyptian Breakfast
  if (
    lower.includes("foul") ||
    lower.includes("ful") ||
    lower.includes("falafel") ||
    lower.includes("taameya") ||
    lower.includes("tameya") ||
    lower.includes("hummus") ||
    lower.includes("shakshuka") ||
    lower.includes("beans")
  ) {
    return "Foul & Falafel";
  }

  // Sandwiches & Wraps
  if (
    lower.includes("sandwich") ||
    lower.includes("burger") ||
    lower.includes("wrap") ||
    lower.includes("panini") ||
    lower.includes("roll") ||
    lower.includes("shawarma") ||
    lower.includes("bun") ||
    lower.includes("toast")
  ) {
    return "Sandwiches & Wraps";
  }

  // Eggs & Omelets
  if (
    lower.includes("egg") ||
    lower.includes("omelet") ||
    lower.includes("omelette") ||
    lower.includes("scramble") ||
    lower.includes("boiled")
  ) {
    return "Eggs & Omelets";
  }

  // Bakery & Pastries
  if (
    lower.includes("croissant") ||
    lower.includes("feteer") ||
    lower.includes("danish") ||
    lower.includes("pastry") ||
    lower.includes("bread") ||
    lower.includes("bagel") ||
    lower.includes("donut") ||
    lower.includes("doughnut") ||
    lower.includes("muffin") ||
    lower.includes("pancake") ||
    lower.includes("waffle") ||
    lower.includes("cookie") ||
    lower.includes("bakery")
  ) {
    return "Bakery & Pastries";
  }

  // Sides & Salads
  if (
    lower.includes("salad") ||
    lower.includes("fries") ||
    lower.includes("potato") ||
    lower.includes("chips") ||
    lower.includes("tahini") ||
    lower.includes("dip") ||
    lower.includes("sauce") ||
    lower.includes("pickles") ||
    lower.includes("yogurt") ||
    lower.includes("fruit") ||
    lower.includes("bowl") ||
    lower.includes("soup")
  ) {
    return "Sides & Salads";
  }

  return "Other Dishes";
}

/**
 * Returns a matching semantic React Icon for the dish name.
 */
export function getDishIcon(name: string, size = 20): React.ReactNode {
  const category = getDishCategory(name);

  switch (category) {
    case "Beverages & Drinks": {
      const lower = name.toLowerCase();
      if (
        lower.includes("coffee") ||
        lower.includes("latte") ||
        lower.includes("espresso") ||
        lower.includes("cappuccino")
      ) {
        return React.createElement(LuCoffee, { size, className: "text-emerald-800" });
      }
      return React.createElement(LuCupSoda, { size, className: "text-emerald-700" });
    }
    case "Foul & Falafel":
      return React.createElement(LuUtensils, { size, className: "text-emerald-800" });
    case "Sandwiches & Wraps":
      return React.createElement(LuSandwich, { size, className: "text-emerald-800" });
    case "Eggs & Omelets":
      return React.createElement(LuEgg, { size, className: "text-emerald-700" });
    case "Bakery & Pastries": {
      const lower = name.toLowerCase();
      if (lower.includes("cookie") || lower.includes("pancake") || lower.includes("waffle")) {
        return React.createElement(LuCookie, { size, className: "text-emerald-700" });
      }
      return React.createElement(LuCroissant, { size, className: "text-emerald-700" });
    }
    case "Sides & Salads":
      return React.createElement(LuSalad, { size, className: "text-emerald-700" });
    default:
      return React.createElement(LuUtensils, { size, className: "text-emerald-700" });
  }
}

/**
 * Returns an icon for a given category tab.
 */
export function getCategoryIcon(category: DishCategory, size = 15): React.ReactNode {
  switch (category) {
    case "All":
      return React.createElement(FiGrid, { size });
    case "Beverages & Drinks":
      return React.createElement(LuCoffee, { size });
    case "Foul & Falafel":
      return React.createElement(LuUtensils, { size });
    case "Sandwiches & Wraps":
      return React.createElement(LuSandwich, { size });
    case "Eggs & Omelets":
      return React.createElement(LuEgg, { size });
    case "Bakery & Pastries":
      return React.createElement(LuCroissant, { size });
    case "Sides & Salads":
      return React.createElement(LuSalad, { size });
    default:
      return React.createElement(LuUtensils, { size });
  }
}

export type CategoryWithCount = {
  category: DishCategory;
  count: number;
};

/**
 * Extracts only the categories that actually exist in the current menu items.
 * Ensures zero empty category tabs and includes the 'All' tab with total count.
 */
export function getAvailableCategories(items: MenuItemDto[]): CategoryWithCount[] {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const cat = getDishCategory(item.name);
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const categoryOrder: DishCategory[] = [
    "Foul & Falafel",
    "Sandwiches & Wraps",
    "Eggs & Omelets",
    "Bakery & Pastries",
    "Beverages & Drinks",
    "Sides & Salads",
    "Other Dishes",
  ];

  const result: CategoryWithCount[] = [
    { category: "All", count: items.length },
  ];

  for (const cat of categoryOrder) {
    if (counts[cat] && counts[cat] > 0) {
      result.push({ category: cat, count: counts[cat] });
    }
  }

  return result;
}
