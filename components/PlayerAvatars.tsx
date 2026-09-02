import React from "react";

export interface AvatarDefinition {
  id: string;
  name: string;
  description: string;
}

export const AVATARS_LIST: AvatarDefinition[] = [
  { id: "avatar_01", name: "The Captain", description: "Teal bg, spiky brown hair, lime kit & captain armband" },
  { id: "avatar_02", name: "The Playmaker", description: "Purple bg, dreadlocks, orange/white kit" },
  { id: "avatar_03", name: "The Wall", description: "Dark blue bg, bald head with beard, keeper gloves" },
  { id: "avatar_04", name: "The Sprinter", description: "Yellow bg, blonde hair, green headband" },
  { id: "avatar_05", name: "The Maestro", description: "Red bg, dark brown wavy hair, sky-blue kit" },
  { id: "avatar_06", name: "The Striker", description: "Pink bg, dark skin, afro hair, neon green kit" },
  { id: "avatar_07", name: "The Anchor", description: "Coral bg, black undercut hair, red/white kit" },
  { id: "avatar_08", name: "The Veteran", description: "Emerald bg, grey short hair, yellow kit" },
  { id: "avatar_09", name: "The Joker", description: "Orange bg, orange spiky hair, purple kit & visor" },
  { id: "avatar_10", name: "The Tactician", description: "Indigo bg, black hair with glasses, navy kit" },
  { id: "avatar_11", name: "The Super-Sub", description: "Magenta bg, braided bun, pink/navy kit" },
  { id: "avatar_12", name: "The Prodigy", description: "Violet bg, curly dark hair, gold kit" },
  { id: "avatar_13", name: "The Safe Hands", description: "Teal bg, blonde side-part, keeper gloves" },
  { id: "avatar_14", name: "The Engine", description: "Lime bg, high-top fade, dark red kit" },
  { id: "avatar_15", name: "The Winger", description: "Maroon bg, red ponytail, light green kit" },
  { id: "avatar_16", name: "The Sweeper", description: "Charcoal bg, slicked-back black hair, captain armband" },
  { id: "avatar_17", name: "The Finisher", description: "Turquoise bg, bleached buzzcut, red/black kit" },
  { id: "avatar_18", name: "The Dynamo", description: "Violet bg, purple headband, grey/neon kit" },
  { id: "avatar_19", name: "The Guard", description: "Warm brown bg, black beanie, maroon kit" },
  { id: "avatar_20", name: "The Champ", description: "Bronze bg, neat beard, striped kit & gold medal" },
];

interface PlayerAvatarProps {
  id: string | null | undefined;
  className?: string;
  onClick?: () => void;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ id, className = "w-12 h-12", onClick }) => {
  const avatarId = id || "avatar_01";

  // Base circular clip path to ensure bubble head shape
  const renderSVGContent = (idStr: string) => {
    switch (idStr) {
      case "avatar_01": // The Captain
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#0D9488" /> {/* Teal BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#84CC16" /> {/* Lime green kit */}
              {/* Captain's Armband on left shoulder (viewer's right) */}
              <rect x="62" y="70" width="12" height="6" fill="#FFFFFF" rx="1" transform="rotate(-15 62 70)" />
              <text x="64" y="75" fontSize="5" fontWeight="bold" fill="#EF4444" transform="rotate(-15 62 70)">C</text>
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FDBA74" /> {/* Peach Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Smile */}
              <path d="M 45 52 Q 50 56, 55 52" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Hair - Spiky Brown */}
              <path d="M 27 40 Q 32 20, 42 24 Q 48 18, 55 24 Q 65 20, 72 38 Q 68 28, 50 28 Q 32 28, 27 40 Z" fill="#78350F" />
            </g>
          </>
        );

      case "avatar_02": // The Playmaker
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#6B21A8" /> {/* Purple BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#EA580C" /> {/* Orange kit */}
              <path d="M 45 68 L 50 78 L 55 68 Z" fill="#FFFFFF" /> {/* V-neck detail */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#92400E" /> {/* Dark Brown Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="43" cy="45" r="1.2" fill="#000000" />
              <circle cx="57" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="57" cy="45" r="1.2" fill="#000000" />
              {/* Smile */}
              <path d="M 44 52 Q 50 57, 56 52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Dreadlocks */}
              <path d="M 24 35 C 20 45, 22 65, 22 75" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              <path d="M 30 28 C 24 38, 26 58, 25 70" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              <path d="M 70 28 C 76 38, 74 58, 75 70" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              <path d="M 76 35 C 80 45, 78 65, 78 75" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              {/* Hair Top */}
              <circle cx="50" cy="27" r="10" fill="#1E293B" />
            </g>
          </>
        );

      case "avatar_03": // The Wall
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#1E3A8A" /> {/* Dark Blue BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#374151" /> {/* Grey keeper jersey */}
              {/* Goalkeeper Glove hands held up in front */}
              <rect x="22" y="68" width="12" height="15" rx="3" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect x="24" y="66" width="3" height="6" rx="1" fill="#FFFFFF" />
              <rect x="28" y="65" width="3" height="7" rx="1" fill="#FFFFFF" />
              <rect x="66" y="68" width="12" height="15" rx="3" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect x="68" y="65" width="3" height="7" rx="1" fill="#FFFFFF" />
              <rect x="72" y="66" width="3" height="6" rx="1" fill="#FFFFFF" />
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#D97706" /> {/* Tan Skin */}
              {/* Bald reflection */}
              <path d="M 35 32 Q 50 20, 65 32" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
              {/* Beard */}
              <path d="M 32 46 C 32 64, 68 64, 68 46 C 68 46, 62 58, 50 58 C 38 58, 32 46, 32 46 Z" fill="#1E293B" />
              {/* Eyes */}
              <circle cx="43" cy="43" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="43" r="2.5" fill="#1E293B" />
              {/* Serious mouth */}
              <line x1="46" y1="50" x2="54" y2="50" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </>
        );

      case "avatar_04": // The Sprinter
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#EAB308" /> {/* Yellow BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#2563EB" /> {/* Blue kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FED7AA" /> {/* Light Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Big Smile */}
              <path d="M 43 51 Q 50 57, 57 51" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Hair - Blonde Swept */}
              <path d="M 27 40 C 27 25, 35 18, 50 18 C 65 18, 73 25, 73 40 C 65 30, 50 30, 27 40 Z" fill="#F59E0B" />
              {/* Green Headband */}
              <rect x="29" y="31" width="42" height="6" fill="#10B981" rx="1" />
            </g>
          </>
        );

      case "avatar_05": // The Maestro
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#DC2626" /> {/* Red BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#38BDF8" /> {/* Sky blue kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#F59E0B" /> {/* Olive skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Smile */}
              <path d="M 44 52 Q 50 56, 56 52" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Hair - Brown Wavy Curly */}
              <path d="M 25 38 C 24 24, 34 16, 50 16 C 66 16, 76 24, 75 38 C 72 32, 68 30, 60 33 C 55 28, 45 28, 40 33 C 32 30, 28 32, 25 38 Z" fill="#451A03" />
            </g>
          </>
        );

      case "avatar_06": // The Striker
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#EC4899" /> {/* Pink BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#1E293B" /> {/* Black kit */}
              <rect x="48" y="65" width="4" height="20" fill="#84CC16" /> {/* Lime details */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#78350F" /> {/* Dark Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="43" cy="45" r="1.2" fill="#000000" />
              <circle cx="57" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="57" cy="45" r="1.2" fill="#000000" />
              {/* Big teeth smile */}
              <path d="M 42 51 Q 50 58, 58 51 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
              {/* Afro Hair */}
              <circle cx="34" cy="32" r="11" fill="#111827" />
              <circle cx="45" cy="24" r="12" fill="#111827" />
              <circle cx="57" cy="24" r="12" fill="#111827" />
              <circle cx="66" cy="32" r="11" fill="#111827" />
              <circle cx="50" cy="32" r="13" fill="#111827" />
            </g>
          </>
        );

      case "avatar_07": // The Anchor
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#F97316" /> {/* Coral BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#DC2626" /> {/* Red kit */}
              <path d="M 30 65 L 50 85 L 70 65" stroke="#FFFFFF" strokeWidth="4" fill="none" /> {/* White stripe */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FFD8A8" /> {/* Peach skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Smile */}
              <path d="M 44 52 Q 50 56, 56 52" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Hair - Black Undercut */}
              <path d="M 28 40 C 27 28, 38 18, 50 18 C 62 18, 73 28, 72 40 C 70 34, 60 25, 50 25 C 40 25, 30 34, 28 40 Z" fill="#111827" />
              <rect x="25" y="36" width="4" height="10" fill="#111827" opacity="0.3" />
              <rect x="71" y="36" width="4" height="10" fill="#111827" opacity="0.3" />
            </g>
          </>
        );

      case "avatar_08": // The Veteran
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#10B981" /> {/* Emerald BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#FBBF24" /> {/* Yellow kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#F5A623" /> {/* Tan Skin */}
              {/* Eyes */}
              <circle cx="43" cy="44" r="2" fill="#1E293B" />
              <circle cx="57" cy="44" r="2" fill="#1E293B" />
              {/* Stubble/Short Beard shadow */}
              <path d="M 33 46 C 33 60, 67 60, 67 46 Z" fill="#6B7280" opacity="0.25" />
              {/* Smart smile */}
              <path d="M 45 52 Q 50 55, 55 52" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Short Grey/Silver Hair */}
              <path d="M 27 38 C 28 26, 38 20, 50 20 C 62 20, 72 26, 73 38 C 70 33, 62 30, 50 30 C 38 30, 30 33, 27 38 Z" fill="#9CA3AF" />
            </g>
          </>
        );

      case "avatar_09": // The Joker
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#F97316" /> {/* Orange BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#7C3AED" /> {/* Purple kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FFD8A8" /> {/* Peach skin */}
              {/* Visor Accessory */}
              <path d="M 25 32 Q 50 24, 75 32 L 73 38 Q 50 30, 27 38 Z" fill="#EF4444" /> {/* Red Visor brim */}
              <rect x="25" y="32" width="50" height="2" fill="#FFFFFF" />
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Tongue out smile */}
              <path d="M 44 51 Q 50 58, 56 51" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 48 54 Q 50 61, 52 54" fill="#EF4444" />
              {/* Orange Spiky Hair peeking out */}
              <path d="M 25 31 L 20 20 L 30 25 L 35 15 L 45 23 L 55 20 L 65 24 L 70 18 L 75 31" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </>
        );

      case "avatar_10": // The Tactician
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#3F51B5" /> {/* Indigo BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#1E3A8A" /> {/* Navy kit */}
              <circle cx="50" cy="74" r="5" fill="#EAB308" /> {/* Gold crest */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#E5A93C" /> {/* Olive skin */}
              {/* Glasses */}
              <circle cx="41" cy="44" r="6" stroke="#111827" strokeWidth="2.5" fill="none" />
              <circle cx="59" cy="44" r="6" stroke="#111827" strokeWidth="2.5" fill="none" />
              <line x1="47" y1="44" x2="53" y2="44" stroke="#111827" strokeWidth="2.5" />
              {/* Eyes inside glasses */}
              <circle cx="41" cy="44" r="1.8" fill="#1E293B" />
              <circle cx="59" cy="44" r="1.8" fill="#1E293B" />
              {/* Clever smile */}
              <path d="M 45 54 Q 50 57, 55 54" stroke="#111827" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Smart short black hair */}
              <path d="M 28 38 C 29 25, 40 20, 50 20 C 60 20, 71 25, 72 38 C 68 33, 60 31, 50 31 C 40 31, 32 33, 28 38 Z" fill="#111827" />
            </g>
          </>
        );

      case "avatar_11": // The Super-Sub
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#D946EF" /> {/* Magenta BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#F472B6" /> {/* Pink jersey */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#D97706" /> {/* Brown Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Smile */}
              <path d="M 44 52 Q 50 56, 56 52" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Braids / Bun Hair */}
              <path d="M 27 40 C 27 28, 38 18, 50 18 C 62 18, 73 28, 73 40 Z" fill="#111827" />
              {/* Top bun */}
              <circle cx="50" cy="14" r="7" fill="#111827" />
              {/* Braid details */}
              <line x1="33" y1="28" x2="31" y2="44" stroke="#D946EF" strokeWidth="2" />
              <line x1="67" y1="28" x2="69" y2="44" stroke="#D946EF" strokeWidth="2" />
            </g>
          </>
        );

      case "avatar_12": // The Prodigy
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#8B5CF6" /> {/* Violet BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#F59E0B" /> {/* Gold kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#C2410C" /> {/* Light brown skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="43" cy="45" r="1" fill="#000000" />
              <circle cx="57" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="57" cy="45" r="1" fill="#000000" />
              {/* Confident Smile */}
              <path d="M 43 52 Q 50 58, 57 52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Curly Hair bubbles */}
              <circle cx="34" cy="30" r="7" fill="#111827" />
              <circle cx="42" cy="24" r="8" fill="#111827" />
              <circle cx="52" cy="23" r="8" fill="#111827" />
              <circle cx="62" cy="26" r="7" fill="#111827" />
              <circle cx="68" cy="34" r="7" fill="#111827" />
              <circle cx="30" cy="38" r="6" fill="#111827" />
            </g>
          </>
        );

      case "avatar_13": // The Safe Hands
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#06B6D4" /> {/* Teal BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#F97316" /> {/* Orange jersey */}
              {/* Goalkeeper Glove hands up */}
              <rect x="24" y="65" width="10" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
              <rect x="66" y="65" width="10" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FED7AA" /> {/* Pale Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Smart smile */}
              <path d="M 44 52 Q 50 56, 56 52" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Blonde Side-Part Hair */}
              <path d="M 27 38 C 28 20, 48 18, 50 25 C 52 18, 72 20, 73 38 C 70 33, 56 30, 50 33 C 44 30, 30 33, 27 38 Z" fill="#FBBF24" />
            </g>
          </>
        );

      case "avatar_14": // The Engine
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#84CC16" /> {/* Lime BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#991B1B" /> {/* Dark red kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#451A03" /> {/* Black Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="43" cy="45" r="1.2" fill="#000000" />
              <circle cx="57" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="57" cy="45" r="1.2" fill="#000000" />
              {/* Huge smile */}
              <path d="M 42 51 Q 50 59, 58 51" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* High-Top Fade Hair */}
              <path d="M 27 36 L 27 22 L 73 22 L 73 36 Z" fill="#111827" />
              <ellipse cx="50" cy="22" rx="23" ry="5" fill="#111827" />
            </g>
          </>
        );

      case "avatar_15": // The Winger
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#9D174D" /> {/* Maroon BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#A7F3D0" /> {/* Light green kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FDBA74" /> {/* Pale Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Friendly smile */}
              <path d="M 44 52 Q 50 56, 56 52" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Hair - Red Ponytail */}
              <path d="M 27 38 C 27 24, 38 18, 50 18 C 62 18, 73 24, 73 38 C 70 34, 58 30, 50 30 C 42 30, 30 34, 27 38 Z" fill="#EA580C" />
              <circle cx="76" cy="30" r="6" fill="#EA580C" /> {/* Ponytail bundle behind */}
              <circle cx="72" cy="26" r="2" fill="#D946EF" /> {/* Hair band */}
            </g>
          </>
        );

      case "avatar_16": // The Sweeper
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#374151" /> {/* Charcoal BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#1D4ED8" /> {/* Blue kit */}
              {/* Yellow striped collar */}
              <path d="M 40 68 L 50 78 L 60 68 Z" fill="#FBBF24" />
              {/* Captain Armband */}
              <rect x="63" y="69" width="12" height="6" fill="#EAB308" rx="1" transform="rotate(-10 63 69)" />
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#F5A623" /> {/* Olive skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Confident smirk */}
              <path d="M 45 52 Q 48 55, 53 51" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Slicked-back Black Hair */}
              <path d="M 27 36 C 28 22, 40 16, 50 16 C 60 16, 72 22, 73 36 C 65 31, 55 30, 50 30 C 45 30, 35 31, 27 36 Z" fill="#111827" />
            </g>
          </>
        );

      case "avatar_17": // The Finisher
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#06B6D4" /> {/* Turquoise BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#EF4444" /> {/* Red kit */}
              <path d="M 46 65 L 46 85 M 54 65 L 54 85" stroke="#000000" strokeWidth="2" /> {/* Vertical stripes */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#78350F" /> {/* Dark Skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="43" cy="45" r="1.2" fill="#000000" />
              <circle cx="57" cy="45" r="2.5" fill="#FFFFFF" />
              <circle cx="57" cy="45" r="1.2" fill="#000000" />
              {/* Smile */}
              <path d="M 44 52 Q 50 56, 56 52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Bleached Blonde Buzzcut */}
              <path d="M 27 40 C 27 25, 38 20, 50 20 C 62 20, 73 25, 73 40 Z" fill="#FEF08A" opacity="0.9" />
              {/* Buzzed hair texture lines */}
              <line x1="38" y1="26" x2="42" y2="30" stroke="#F59E0B" strokeWidth="1" />
              <line x1="48" y1="24" x2="48" y2="29" stroke="#F59E0B" strokeWidth="1" />
              <line x1="58" y1="25" x2="55" y2="29" stroke="#F59E0B" strokeWidth="1" />
            </g>
          </>
        );

      case "avatar_18": // The Dynamo
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#7C3AED" /> {/* Purple/Violet BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#374151" /> {/* Grey kit */}
              <circle cx="50" cy="74" r="5" fill="#A8FF00" /> {/* Neon green badge */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#FED7AA" /> {/* Peach skin */}
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Open happy smile */}
              <path d="M 43 51 Q 50 57, 57 51" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Hair - Brown messy */}
              <path d="M 27 38 C 28 22, 38 18, 50 18 C 62 18, 72 22, 73 38 C 68 33, 50 32, 27 38 Z" fill="#78350F" />
              {/* Purple Headband */}
              <rect x="29" y="30" width="42" height="5" fill="#C084FC" rx="1" />
            </g>
          </>
        );

      case "avatar_19": // The Guard
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#78350F" /> {/* Warm Brown BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#991B1B" /> {/* Maroon kit */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#D97706" /> {/* Tan Skin */}
              {/* Beanie Accessory */}
              <path d="M 26 35 C 28 18, 72 18, 74 35 Z" fill="#1F2937" /> {/* Black Beanie */}
              <rect x="26" y="32" width="48" height="5" fill="#374151" rx="1" />
              {/* Eyes */}
              <circle cx="43" cy="45" r="2.5" fill="#1E293B" />
              <circle cx="57" cy="45" r="2.5" fill="#1E293B" />
              {/* Determined straight mouth */}
              <line x1="45" y1="52" x2="55" y2="52" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </>
        );

      case "avatar_20": // The Champ
        return (
          <>
            <circle cx="50" cy="50" r="48" fill="#CD7F32" /> {/* Bronze BG */}
            <g clipPath="url(#avatar-clip-circle)">
              {/* Shoulders & Kit */}
              <path d="M 18 85 C 18 65, 82 65, 82 85 Z" fill="#15803D" /> {/* Striped Green/White */}
              <path d="M 32 65 L 32 85 M 42 65 L 42 85 M 58 65 L 58 85 M 68 65 L 68 85" stroke="#FFFFFF" strokeWidth="4" />
              {/* Gold Medal Strap & Ribbon */}
              <path d="M 42 68 L 50 82 L 58 68" stroke="#EF4444" strokeWidth="3.5" fill="none" />
              <circle cx="50" cy="85" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1" /> {/* Gold Medal */}
              {/* Head / Face */}
              <circle cx="50" cy="46" r="23" fill="#451A03" /> {/* Dark Skin */}
              {/* Beard */}
              <path d="M 32 46 C 32 64, 68 64, 68 46 C 68 46, 62 58, 50 58 C 38 58, 32 46, 32 46 Z" fill="#111827" />
              {/* Eyes */}
              <circle cx="43" cy="44" r="2.5" fill="#FFFFFF" />
              <circle cx="43" cy="44" r="1" fill="#000000" />
              <circle cx="57" cy="44" r="2.5" fill="#FFFFFF" />
              <circle cx="57" cy="44" r="1" fill="#000000" />
              {/* Satisfied Smile */}
              <path d="M 44 51 Q 50 55, 56 51" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Messy Black Hair on Top */}
              <path d="M 27 38 C 28 24, 40 18, 50 18 C 60 18, 72 24, 73 38 C 68 33, 50 31, 27 38 Z" fill="#111827" />
            </g>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      id={avatarId}
      className={`${className} overflow-hidden select-none`}
      viewBox="0 0 100 100"
      onClick={onClick}
    >
      <defs>
        <clipPath id="avatar-clip-circle">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>
      {renderSVGContent(avatarId)}
    </svg>
  );
};
