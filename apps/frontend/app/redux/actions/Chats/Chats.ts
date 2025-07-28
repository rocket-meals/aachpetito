import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class ChatsHelper extends CollectionHelper<DatabaseTypes.Chats> {
  constructor(client?: any) {
    super('chats', client || ServerAPI.getClient());
  }

  async fetchChatsByProfile(profileId: string, queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['*', '!messages'],
      limit: 100,
      sort: ['-date_updated'],
      filter: {
        participants: { profiles_id: { _eq: profileId } },
      },
    };
    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItems(query);
  }

  async fetchChatById(id: string, queryOverride: any = {}) {
    const defaultQuery = { fields: ['*', '!messages'] };
    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItem(id, query);
  }
}
