import { pitchService } from './services/pitchService.ts';

pitchService.listPublic().then(pitches => {
    console.log("Pitches:", pitches.map(p => ({ id: p.id, name: p.name, images: p.images })));
}).catch(console.error);
