"use client";

import dynamic from "next/dynamic";

const AnalyticsClient = dynamic(() => import("./AnalyticsClient"), { ssr: false });

export default AnalyticsClient;
