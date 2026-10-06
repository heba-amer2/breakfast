"use client";

import Link from "next/link";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiX,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState } from "@/components/ui";
import { useReceiptEntry } from "@/features/billing/hooks/useReceiptEntry";
import { ReceiptRoomHero } from "@/features/billing/components/ReceiptRoomHero";
import { ReceiptItemsTable } from "@/features/billing/components/ReceiptItemsTable";
import { ReceiptTotalsCard } from "@/features/billing/components/ReceiptTotalsCard";
import { ReceiptLiveSplitCard } from "@/features/billing/components/ReceiptLiveSplitCard";

export default function ReceiptEntryPage() {
  const {
    roomId,
    room,
    menu,
    bill,
    receiptDraft,
    roomError,
    orderError,
    billingError,
    loading,
    success,
    dismissedError,
    dismissErrors,
    register,
    summary,
    items,
    participantCount,
    participants,
    priceFor,
    handlePriceChange,
    deliveryFee,
    foodSubtotal,
    computedTotal,
    receiptTotal,
    unpricedItems,
    isOpen,
    isFinalized,
    previewing,
    submitting,
    handlePreview,
    handleSubmit,
  } = useReceiptEntry();

  const activeError = !dismissedError && (roomError || orderError || billingError);

  return (
    <>
      <TopBar
        title={room?.restaurantName ? `Receipt · ${room.restaurantName}` : "Enter Paper Receipt"}
        subtitle="Record line-item prices, printed total, and delivery fee to generate bill splits."
        tag="ADMIN OPS"
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/admin/rooms/${Number.isFinite(roomId) ? roomId : ""}/summary`}
              className="flex-1 sm:flex-none"
            >
              <Button size="sm" variant="secondary" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
                <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <FiArrowLeft size={14} />
                  <span>Room summary</span>
                </span>
              </Button>
            </Link>

            {room?.status === "PENDING_ADMIN_APPROVAL" ? (
              <Link
                href={`/admin/rooms/${Number.isFinite(roomId) ? roomId : ""}/approval`}
                className="flex-1 sm:flex-none"
              >
                <Button size="sm" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
                  <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <span>Approve room</span>
                    <FiArrowRight size={14} />
                  </span>
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {/* Open Room Warning Banner */}
        {isOpen ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FiClock size={18} className="shrink-0 text-amber-600" />
              <span>
                <strong>This room is currently OPEN:</strong> Orders may still arrive. Normally, receipts should be entered after closing the room and placing the phone order.
              </span>
            </div>
            <Link href={`/admin/rooms/${roomId}/summary`}>
              <Button variant="secondary" size="sm">
                View Calling Sheet
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Existing Draft Receipt Informational Banner */}
        {receiptDraft && !success ? (
          <div className="mb-6 flex items-start justify-between rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-900 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <FiInfo size={18} className="shrink-0 text-sky-600 mt-0.5" />
              <div>
                <p className="font-bold">Existing receipt draft loaded</p>
                <p className="text-xs text-sky-800 mt-0.5">
                  A receipt draft was previously recorded for this room. You can adjust line prices or update the delivery fee below, then preview or re-save anytime.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Error Banner */}
        {activeError ? (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FiAlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{activeError}</span>
            </div>
            <button
              type="button"
              onClick={dismissErrors}
              className="text-rose-400 hover:text-rose-600 p-1"
              title="Dismiss error"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : null}

        {/* Success Banner */}
        {success ? (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{success}</span>
            </div>
            <Link href={`/admin/rooms/${roomId}/approval`}>
              <Button size="sm" variant="secondary" className="text-xs">
                Proceed to approval &rarr;
              </Button>
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-[30px] bg-slate-100" />
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
            </div>
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="The requested room could not be loaded."
            action={
              <Link href="/admin/approval-queue?tab=closed&stage=receipt">
                <Button size="sm">Back to queue</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            <ReceiptRoomHero
              room={room}
              items={items}
              participantCount={participantCount}
              summary={summary}
              foodSubtotal={foodSubtotal}
              unpricedItems={unpricedItems}
            />

            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              {/* Left Column: Line Items Table & Totals Card */}
              <div className="space-y-6">
                <ReceiptItemsTable
                  items={items}
                  menu={menu}
                  isOpen={isOpen}
                  isFinalized={isFinalized}
                  priceFor={priceFor}
                  handlePriceChange={handlePriceChange}
                />

                <ReceiptTotalsCard
                  register={register}
                  isFinalized={isFinalized}
                  foodSubtotal={foodSubtotal}
                  deliveryFee={deliveryFee}
                  computedTotal={computedTotal}
                />
              </div>

              {/* Right Column: Live Bill Split Preview & Save Actions */}
              <div className="space-y-6">
                <ReceiptLiveSplitCard
                  bill={bill}
                  foodSubtotal={foodSubtotal}
                  deliveryFee={deliveryFee}
                  participantCount={participantCount}
                  summaryParticipantCount={summary?.participantCount}
                  receiptTotal={receiptTotal}
                  previewing={previewing}
                  handlePreview={handlePreview}
                  roomId={roomId}
                  itemsCount={items.length}
                  participants={participants}
                  isFinalized={isFinalized}
                  submitting={submitting}
                  handleSubmit={handleSubmit}
                  receiptDraft={receiptDraft}
                />
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
