"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";

type SaveButtonProps = {
  itemType: "shoe" | "attire" | "song" | "plan";
  itemId: string;
  label: string;
  metadata?: Record<string, unknown>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SaveButton({
  itemType,
  itemId,
  label,
  metadata
}: SaveButtonProps) {
  const { user, supabaseAvailable } = useAuth();
  const [state, setState] = useState<SaveState>("idle");
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      return;
    }

    let active = true;

    supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) {
          return;
        }
        setState(data ? "saved" : "idle");
        setChecked(true);
      });

    return () => {
      active = false;
    };
  }, [itemType, itemId, user]);

  const handleToggle = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      return;
    }

    const isSaved = state === "saved";
    setState("saving");

    if (isSaved) {
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) {
        setState("error");
        return;
      }

      setState("idle");
      return;
    }

    const { error } = await supabase
      .from("saved_items")
      .upsert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        label,
        metadata
      });

    if (error) {
      setState("error");
      return;
    }

    setState("saved");
  };

  if (!supabaseAvailable) {
    return null;
  }

  if (!user) {
    const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
    return (
      <Link className="btn btn-ghost btn-sm" href={`/login${redirect}`}>
        Sign in to save
      </Link>
    );
  }

  if (!checked) {
    return <span className="brand-sub">Checking...</span>;
  }

  return (
    <button
      className={`btn btn-sm ${state === "saved" ? "btn-primary" : "btn-ghost"}`}
      type="button"
      onClick={handleToggle}
      disabled={state === "saving"}
      aria-pressed={state === "saved"}
      title={state === "saved" ? "Remove from saved" : "Save this item"}
    >
      {state === "saving"
        ? "Saving"
        : state === "saved"
        ? "Saved"
        : "Save"}
    </button>
  );
}
