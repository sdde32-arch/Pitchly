import { pitchService } from '../services/pitchService';
export const autoSeedIfEmpty = async (ownerId?: string) => { if (localStorage.getItem('pitchly_seeded') === 'true') { return;
} try { const existing = await pitchService.listPublic();
if (existing && existing.length > 0) { localStorage.setItem('pitchly_seeded', 'true'); return;
} if (!ownerId) { 
// Cannot seed without a valid user ID to associate 
return;
}
const turfsToSeed = [ { name: "Arches Gardens Pitch", location: "Kololo, Kampala", fullAddress: "Kololo, Kampala, Central Region", coordinates: { latitude: 0.3476, longitude: 32.5825 }, pricePerHour: 50000, amenities: ["Floodlights", "Parking", "Water", "Changing Rooms"], openingHour: "06:00", closingHour: "22:00", contactPhone: "0770000000", staffNames: ["Manager"], pitchFormats: ["5v5", "7v7"], status: "approved" as any, images: ["https://images.unsplash.com/photo-1529900748604-07360bb06c4a?w=800"] },
{ name: "Panamera Football Pitch", location: "Kololo, Kampala", fullAddress: "Kololo, Kampala, Central Region", coordinates: { latitude: 0.3420, longitude: 32.5910 }, pricePerHour: 60000, amenities: ["Floodlights", "Security", "Parking", "Water"], openingHour: "06:00", closingHour: "22:00", contactPhone: "0770000001", staffNames: ["Manager"], pitchFormats: ["5v5"], status: "approved" as any, images: ["https://images.unsplash.com/photo-1551958219-acbc595bdc05?w=800"] },
{ name: "Naguru Pitch Arena", location: "Naguru, Kampala", fullAddress: "Naguru, Kampala, Central Region", coordinates: { latitude: 0.3380, longitude: 32.6012 }, pricePerHour: 45000, amenities: ["Floodlights", "Water", "Locker Rooms"], openingHour: "06:00", closingHour: "21:00", contactPhone: "0770000002", staffNames: ["Manager"], pitchFormats: ["7v7", "11v11"], status: "approved" as any, images: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"] },
{ name: "Bugolobi Sports Grounds", location: "Bugolobi, Kampala", fullAddress: "Bugolobi, Kampala, Central Region", coordinates: { latitude: 0.3201, longitude: 32.6089 }, pricePerHour: 55000, amenities: ["Floodlights", "Parking", "Changing Rooms", "Canteen"], openingHour: "06:00", closingHour: "22:00", contactPhone: "0770000003", staffNames: ["Manager"], pitchFormats: ["5v5", "7v7"], status: "approved" as any, images: ["https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"] },
{ name: "Muyenga Turf Centre", location: "Muyenga, Kampala", fullAddress: "Muyenga, Kampala, Central Region", coordinates: { latitude: 0.2987, longitude: 32.5934 }, pricePerHour: 70000, amenities: ["Floodlights", "Parking", "VIP Lounge", "Water", "Changing Rooms", "Security"], openingHour: "06:00", closingHour: "23:00", contactPhone: "0770000004", staffNames: ["Manager"], pitchFormats: ["11v11"], status: "approved" as any, images: ["https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800"]
} ]; 
    let i = 1;
    for (const t of turfsToSeed) {
      await pitchService.create({
        id: `seeded-pitch-${i++}-${Date.now()}`,
        ownerId: ownerId,
        name: t.name,
        location: t.location,
        fullAddress: t.fullAddress,
        coordinates: [t.coordinates.latitude, t.coordinates.longitude],
        pricePerHour: t.pricePerHour,
        pitchFormats: t.pitchFormats,
        amenities: t.amenities,
        images: t.images,
        openingHour: t.openingHour,
        closingHour: t.closingHour,
        isVerified: true,
        status: "approved" as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);
    }
    console.log(`Auto-seeded ${turfsToSeed.length} turfs.`); 
    localStorage.setItem('pitchly_seeded', 'true');
  } catch (error) { 
    console.warn("Auto-seeding turfs failed:", error); 
  }
};
export const seedTurfs = async (userId?: string) => { try { await autoSeedIfEmpty(userId);
return { success: true, message: "Turfs seeding completed." };
} catch (error: any) { return { success: false, message: error.message || "Failed to seed turfs." }; }
};
