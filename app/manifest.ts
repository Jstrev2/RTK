import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Runner Toolkit",
    short_name: "Runner Toolkit",
    description:
      "Free tools to find running shoes, build a run playlist, and plan race fuel—plus adaptive training when your schedule changes.",
    start_url: "/",
    display: "browser",
    background_color: "#f4f0e7",
    theme_color: "#f4f0e7",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
