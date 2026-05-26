"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

interface Props {
  onSelect: (lat: number, lng: number, address: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

// Load Google Maps script once — idempotent
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      resolve();
      return;
    }

    // Script tag already added but not yet loaded
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

export default function PlacesSearch({ onSelect, placeholder = "Search for an address…", defaultValue = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address"],
    });

    const listener = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address ?? inputRef.current?.value ?? "";

      setSelectedAddress(address);
      setInputValue(address);
      onSelect(lat, lng, address);
    });

    return () => {
      window.google.maps.event.removeListener(listener);
    };
  }, [loaded, onSelect]);

  function clearSelection() {
    setSelectedAddress(null);
    setInputValue("");
    if (inputRef.current) inputRef.current.value = "";
    onSelect(0, 0, "");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    outline: "none",
    borderRadius: 12,
    padding: "12px 16px 12px 40px",
    fontSize: 14,
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Pin icon */}
      <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 1, pointerEvents: "none" }}>
        <MapPin size={16} color="#666" strokeWidth={2} />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={error ? "Google Maps unavailable" : placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={!!error}
        style={{ ...inputStyle, paddingRight: selectedAddress ? 36 : 16 }}
        autoComplete="off"
      />

      {/* Clear button */}
      {selectedAddress && (
        <button
          type="button"
          onClick={clearSelection}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 6,
            padding: "3px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={13} color="#909090" strokeWidth={2} />
        </button>
      )}

      {/* Error message */}
      {error && (
        <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>{error}</p>
      )}

      {/* Confirmation badge */}
      {selectedAddress && !error && (
        <p style={{ fontSize: 11, color: "#D4FF4F", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} strokeWidth={2} />
          {selectedAddress}
        </p>
      )}
    </div>
  );
}
