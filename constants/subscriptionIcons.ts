import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";

export type SubscriptionVectorIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const glyphMap = MaterialCommunityIcons.glyphMap as Record<string, number>;

const categoryIconMap: Record<string, SubscriptionVectorIconName> = {
    Entertainment: "movie-open-play",
    "AI Tools": "robot-outline",
    "Developer Tools": "code-braces",
    Design: "palette",
    Productivity: "calendar-check",
    Cloud: "cloud-outline",
    Music: "music",
    Other: "wallet-outline",
};

const brandIconMatches: { keywords: string[]; iconName: SubscriptionVectorIconName }[] = [
    { keywords: ["visual studio code", "vscode"], iconName: "microsoft-visual-studio-code" },
    { keywords: ["azure devops"], iconName: "microsoft-azure-devops" },
    { keywords: ["google cloud", "gcp"], iconName: "google-cloud" },
    { keywords: ["google drive"], iconName: "google-drive" },
    { keywords: ["google maps"], iconName: "google-maps" },
    { keywords: ["youtube music"], iconName: "youtube" },
    { keywords: ["youtube tv"], iconName: "youtube-tv" },
    { keywords: ["youtube"], iconName: "youtube" },
    { keywords: ["netflix"], iconName: "netflix" },
    { keywords: ["spotify"], iconName: "spotify" },
    { keywords: ["github"], iconName: "github" },
    { keywords: ["gitlab"], iconName: "gitlab" },
    { keywords: ["bitbucket"], iconName: "bitbucket" },
    { keywords: ["dropbox"], iconName: "dropbox" },
    { keywords: ["slack"], iconName: "slack" },
    { keywords: ["jira"], iconName: "jira" },
    { keywords: ["trello"], iconName: "trello" },
    { keywords: ["aws", "amazon web services"], iconName: "aws" },
    { keywords: ["azure"], iconName: "microsoft-azure" },
    { keywords: ["digital ocean", "digitalocean"], iconName: "digital-ocean" },
    { keywords: ["docker"], iconName: "docker" },
    { keywords: ["kubernetes", "k8s"], iconName: "kubernetes" },
    { keywords: ["firebase"], iconName: "firebase" },
    { keywords: ["hulu"], iconName: "hulu" },
    { keywords: ["apple"], iconName: "apple" },
    { keywords: ["google"], iconName: "google" },
    { keywords: ["microsoft", "office 365"], iconName: "microsoft" },
    { keywords: ["xbox"], iconName: "microsoft-xbox" },
    { keywords: ["adobe"], iconName: "application-edit-outline" },
    { keywords: ["figma"], iconName: "palette-swatch" },
    { keywords: ["canva"], iconName: "palette" },
    { keywords: ["notion"], iconName: "notebook-outline" },
    { keywords: ["openai", "chatgpt", "chat gpt", "claude", "anthropic", "gemini", "perplexity"], iconName: "robot-outline" },
    { keywords: ["medium", "substack", "news"], iconName: "newspaper" },
    { keywords: ["discord"], iconName: "message-video" },
    { keywords: ["zoom", "meet"], iconName: "video-account" },
    { keywords: ["linear", "asana", "todoist", "monday"], iconName: "format-list-checks" },
    { keywords: ["database", "supabase"], iconName: "database" },
    { keywords: ["server", "hosting", "host"], iconName: "server" },
    { keywords: ["domain", "web"], iconName: "web" },
    { keywords: ["music", "audio"], iconName: "music" },
    { keywords: ["movie", "video", "stream"], iconName: "movie-open-play" },
    { keywords: ["design", "photo", "creative"], iconName: "palette" },
    { keywords: ["code", "developer", "dev"], iconName: "code-braces" },
    { keywords: ["cloud"], iconName: "cloud-outline" },
];

const normalize = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/\+/g, " plus ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const toIconName = (value: string) => normalize(value).replace(/\s+/g, "-");

const isIconName = (value: string): value is SubscriptionVectorIconName => value in glyphMap;

export const getSubscriptionIconName = (
    subscriptionName: string,
    category?: string,
): SubscriptionVectorIconName => {
    const normalizedName = normalize(subscriptionName);
    const exactIconName = toIconName(subscriptionName);

    if (isIconName(exactIconName)) {
        return exactIconName;
    }

    const brandMatch = brandIconMatches.find(({ keywords }) =>
        keywords.some((keyword) => normalizedName.includes(normalize(keyword))),
    );

    if (brandMatch) {
        return brandMatch.iconName;
    }

    return categoryIconMap[category ?? ""] ?? categoryIconMap.Other;
};
