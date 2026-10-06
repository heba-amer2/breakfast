"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiPlusCircle,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RestaurantFormModal } from "@/components/admin/restaurant-form-modal";
import { MenuItemFormModal } from "@/components/admin/menu-item-form-modal";
import { DeleteMenuItemModal } from "@/components/admin/delete-menu-item-modal";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import {
  fetchRestaurants,
  fetchRestaurantMenu,
} from "@/features/restaurants/store/restaurantThunks";
import { formatMoney } from "@/lib/formatters";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";
import { AdminRestaurantsList } from "../components/AdminRestaurantsList";
import { AdminRestaurantDetailHeader } from "../components/AdminRestaurantDetailHeader";
import { AdminRestaurantMenuItems } from "../components/AdminRestaurantMenuItems";

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const restaurants = useAppSelector((state) => state.restaurants.items);
  const menu = useAppSelector((state) => state.restaurants.menu);
  const error = useAppSelector((state) => state.restaurants.error);

  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedIdOverride, setSelectedIdOverride] = useState<number | null>(null);
  const selectedRestaurantId =
    selectedIdOverride ?? (restaurants[0]?.id ?? null);

  // Search queries
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");

  // Modals state
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [itemModalConfig, setItemModalConfig] = useState<{
    isOpen: boolean;
    item: MenuItemDto | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    item: MenuItemDto | null;
  }>({
    isOpen: false,
    item: null,
  });

  // Success / info feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Initial load of all restaurants
  const loadRestaurants = async () => {
    setLoadingRestaurants(true);
    await dispatch(fetchRestaurants());
    setLoadingRestaurants(false);
  };

  useAuthFetch(loadRestaurants, []);

  // Load menu whenever selected restaurant changes
  useAuthFetch(async () => {
    if (!selectedRestaurantId) return;
    setLoadingMenu(true);
    await dispatch(fetchRestaurantMenu(selectedRestaurantId));
    setLoadingMenu(false);
  }, [selectedRestaurantId]);

  // Selected restaurant object
  const selectedRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || null;
  }, [restaurants, selectedRestaurantId]);

  // Filtered restaurants based on search
  const filteredRestaurants = useMemo(() => {
    const query = restaurantSearch.trim().toLowerCase();
    if (!query) return restaurants;

    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.phone ?? "").toLowerCase().includes(query),
    );
  }, [restaurants, restaurantSearch]);

  // Filtered menu items based on menu search
  const filteredMenu = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return menu;

    return menu.filter((item) => item.name.toLowerCase().includes(query));
  }, [menu, menuSearch]);

  // Check admin role protection
  if (user && user.role !== "ADMIN") {
    return (
      <PageContainer className="p-8">
        <EmptyState
          title="Access Restricted"
          description="Only administrators can manage restaurants and menus."
        />
      </PageContainer>
    );
  }

  return (
    <>
      {/* Top Header */}
      <TopBar
        title="Restaurants & Menus"
        subtitle="Manage restaurants and their verified menus."
        tag="ADMIN OPS"
        badge={
          restaurants.length > 0
            ? `${restaurants.length} vendor${restaurants.length === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          <Button
            size="sm"
            onClick={() => setIsAddRestaurantOpen(true)}
            className="cursor-pointer w-full sm:w-auto min-h-[38px] sm:min-h-[36px]"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <FiPlusCircle size={15} />
              + Add Restaurant
            </span>
          </Button>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {/* Feedback Alert Banner */}
        {feedback ? (
          <div
            className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-xs transition-all ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <FiCheckCircle size={16} className="text-emerald-600" />
              ) : (
                <FiAlertCircle size={16} className="text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <FiX size={14} />
            </button>
          </div>
        ) : null}

        {/* Global Error Banner */}
        {error ? (
          <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs">
            <div className="flex items-center gap-2">
              <FiAlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRestaurants}
              className="shrink-0"
            >
              <span className="inline-flex items-center gap-1">
                <FiRefreshCw size={12} />
                Retry
              </span>
            </Button>
          </div>
        ) : null}

        {/* 2-Column Master-Detail Layout */}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start w-full min-w-0">
          <AdminRestaurantsList
            loading={loadingRestaurants}
            restaurants={restaurants}
            filteredRestaurants={filteredRestaurants}
            selectedRestaurantId={selectedRestaurantId}
            restaurantSearch={restaurantSearch}
            onSearchChange={setRestaurantSearch}
            onSelectRestaurant={(id) => {
              setSelectedIdOverride(id);
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                router.push(`/admin/restaurants/${id}`);
              }
            }}
            onOpenAddModal={() => setIsAddRestaurantOpen(true)}
          />

          <section className="space-y-4 w-full min-w-0 hidden lg:block">
            {selectedRestaurant ? (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <AdminRestaurantDetailHeader
                  restaurant={selectedRestaurant}
                  menuLength={menu.length}
                  loadingMenu={loadingMenu}
                  onAddMenuItem={() =>
                    setItemModalConfig({ isOpen: true, item: null })
                  }
                />

                <AdminRestaurantMenuItems
                  menu={menu}
                  filteredMenu={filteredMenu}
                  loadingMenu={loadingMenu}
                  menuSearch={menuSearch}
                  onMenuSearchChange={setMenuSearch}
                  onOpenAddModal={() =>
                    setItemModalConfig({ isOpen: true, item: null })
                  }
                  onEditItem={(item) =>
                    setItemModalConfig({ isOpen: true, item })
                  }
                  onDeleteItem={(item) =>
                    setDeleteModalConfig({ isOpen: true, item })
                  }
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-xs">
                <EmptyState
                  title="No restaurant selected"
                  description="Choose a restaurant from the left list to view and manage its verified dishes."
                />
              </div>
            )}
          </section>
        </div>
      </PageContainer>

      {/* Add Restaurant Modal */}
      {isAddRestaurantOpen ? (
        <RestaurantFormModal
          isOpen={isAddRestaurantOpen}
          onClose={() => setIsAddRestaurantOpen(false)}
          onSuccess={(created) => {
            setIsAddRestaurantOpen(false);
            setSelectedIdOverride(created.id);
            router.push(`/admin/restaurants/${created.id}`);
          }}
        />
      ) : null}

      {/* Add / Edit Menu Item Modal */}
      {selectedRestaurant ? (
        <MenuItemFormModal
          isOpen={itemModalConfig.isOpen}
          onClose={() => setItemModalConfig({ isOpen: false, item: null })}
          restaurantId={selectedRestaurant.id}
          item={itemModalConfig.item}
          onSuccess={(saved) => {
            setFeedback({
              type: "success",
              message: `Menu item "${saved.name}" saved at ${formatMoney(saved.verifiedPrice)}!`,
            });
          }}
        />
      ) : null}

      {/* Delete Menu Item Confirmation Modal */}
      {selectedRestaurant ? (
        <DeleteMenuItemModal
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig({ isOpen: false, item: null })}
          restaurantId={selectedRestaurant.id}
          item={deleteModalConfig.item}
          onSuccess={() => {
            setFeedback({
              type: "success",
              message: `Menu item "${deleteModalConfig.item?.name}" has been removed.`,
            });
          }}
        />
      ) : null}
    </>
  );
}

