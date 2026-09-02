import { OwnerProfile } from '../types/firebase';

export const ownerService = {
  collectionPath: 'owners',

  async create(owner: OwnerProfile): Promise<OwnerProfile> {
    console.log(`Creating owner profile in ${this.collectionPath}`, owner);
    return owner;
  },

  async getById(id: string): Promise<OwnerProfile | null> {
    console.log(`Fetching owner profile ${id} from ${this.collectionPath}`);
    return null;
  },

  async update(id: string, data: Partial<OwnerProfile>): Promise<void> {
    console.log(`Updating owner profile ${id} in ${this.collectionPath}`, data);
  }
};
