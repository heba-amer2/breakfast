"use client";

import Link from "next/link";
import { FiAlertCircle, FiArrowLeft, FiFileText, FiRefreshCw, FiShoppingBag } from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui";
import { RoomCartSidebar } from "@/features/rooms/components/RoomCartSidebar";
import { RoomClosedBanner } from "@/features/rooms/components/RoomClosedBanner";
import { RoomFloatingCartBar } from "@/features/rooms/components/RoomFloatingCartBar";
import { RoomMenuSection } from "@/features/rooms/components/RoomMenuSection";
import { RoomOrderingHeader } from "@/features/rooms/components/RoomOrderingHeader";
import { useRoomOrdering } from "@/features/rooms/hooks/useRoomOrdering";

export default function RoomDetailScreen() {
  const {
    roomId,
    room,
    menu,
    cart,
    orderSummary,
    roomError,
    orderError,
    isAdmin,
    loading,
    search,
    setSearch,
    sortKey,
    setSortKey,
    viewMode,
    setViewMode,
    addingMenuKey,
    addedItemKey,
    isOpen,
    cartTotal,
    filteredMenu,
    cartItemCounts,
    menuNamesSet,
    handleAddMenuItem,
    onAddCustom,
    handleDeleteCartItem,
    loadRoomData,
    handleRoomExpire,
    resetFilters,
    hasActiveError,
    registerCustom,
    handleCustomSubmit,
    customErrors,
    addingCustom,
  } = useRoomOrdering();

  return (
    <>
      <TopBar
        title={room?.restaurantName ? room.restaurantName : "Breakfast Room"}
        subtitle="Select dishes from verified past receipts or add any custom breakfast order."
        tag={isOpen ? "Live Ordering" : "Closed Room"}
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href={isAdmin ? "/admin/admin-dashboard" : "/user/rooms"} className="flex-1 sm:flex-none">
              <Button variant="secondary" size="sm" fullWidth className="sm:w-auto">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <FiArrowLeft size={14} />
                  <span>{isAdmin ? "Dashboard" : "All Rooms"}</span>
                </span>
              </Button>
            </Link>
            {!isOpen && isAdmin ? (
              <Link href={`/admin/rooms/${roomId}/summary`} className="flex-1 sm:flex-none">
                <Button variant="secondary" size="sm" fullWidth className="sm:w-auto">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <FiFileText size={14} />
                    <span>Calling Sheet</span>
                  </span>
                </Button>
              </Link>
            ) : null}
            <Link href={`/user/rooms/${roomId}/cart`} className="flex-1 sm:flex-none">
              <Button size="sm" variant={isOpen ? "primary" : "secondary"} fullWidth className="sm:w-auto">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <FiShoppingBag size={14} />
                  <span>Cart ({cart.length})</span>
                </span>
              </Button>
            </Link>
          </div>
        }
      />

      <PageContainer className={`space-y-4 sm:space-y-6 pb-12 ${cart.length > 0 ? "pb-24 xl:pb-12" : ""}`}>
        {/* Error Alert State with Retry Action */}
        {hasActiveError ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <FiAlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{roomError || orderError}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRoomData}
              className="shrink-0 self-start sm:self-auto"
            >
              <span className="inline-flex items-center gap-1.5">
                <FiRefreshCw size={13} />
                Retry
              </span>
            </Button>
          </div>
        ) : null}

        {/* 1. Room Header */}
        <RoomOrderingHeader
          loading={loading}
          room={room}
          isOpen={isOpen}
          orderSummary={orderSummary}
          onExpire={handleRoomExpire}
        />

        {/* Closed Room Banner with Admin Actions */}
        {!isOpen && room ? (
          <RoomClosedBanner room={room} isAdmin={isAdmin} />
        ) : null}

        {/* 2-Column Ordering Surface: Menu on Left, Sticky Cart & Custom Dish on Right */}
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <RoomMenuSection
            loading={loading}
            menu={menu}
            filteredMenu={filteredMenu}
            search={search}
            onSearchChange={setSearch}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onResetFilters={resetFilters}
            isOpen={isOpen}
            cartItemCounts={cartItemCounts}
            addingMenuKey={addingMenuKey}
            addedItemKey={addedItemKey}
            onAddMenuItem={handleAddMenuItem}
          />

          <RoomCartSidebar
            roomId={roomId}
            room={room}
            cart={cart}
            cartTotal={cartTotal}
            menuNamesSet={menuNamesSet}
            loading={loading}
            isOpen={isOpen}
            isAdmin={isAdmin}
            orderSummary={orderSummary}
            onDeleteCartItem={handleDeleteCartItem}
            registerCustom={registerCustom}
            handleCustomSubmit={handleCustomSubmit}
            onAddCustom={onAddCustom}
            customErrors={customErrors}
            addingCustom={addingCustom}
          />
        </div>

        {/* Mobile/Tablet Floating Cart Bar */}
        <RoomFloatingCartBar
          roomId={roomId}
          cartLength={cart.length}
          cartTotal={cartTotal}
          isOpen={isOpen}
        />
      </PageContainer>
    </>
  );
}

