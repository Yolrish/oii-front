export interface UserProfileMetadataType {
    sub: string;
    nickname: string;
    name: string;
    picture: string;
    updated_at: string;
    email: string;
    email_verified: boolean;
}

export interface UserProfileType {
    id: string;
    name: string;
    email?: string;
    // phone: string | null;
    picture: string;
    status: string;
    bio: string;
    // metadata: UserProfileMetadataType;
    created_at: string;
    updated_at: string;

    device_id: string;
    is_anonymous: boolean;
    is_onboard_completed: boolean;
    is_onboard_data_ready: boolean;
}

export const checkIsUserProfileType = (obj: any): obj is UserProfileType => {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    // 检查基本字段
    if (typeof obj.id !== 'string' ||
        typeof obj.name !== 'string' ||
        // typeof obj.email !== 'string' ||
        // (obj.phone !== null && typeof obj.phone !== 'string') ||
        typeof obj.picture !== 'string' ||
        typeof obj.status !== 'string' ||
        typeof obj.bio !== 'string' ||
        typeof obj.created_at !== 'string' ||
        typeof obj.updated_at !== 'string') {
        return false;
    }

    // // 检查metadata字段
    // if (!obj.metadata || typeof obj.metadata !== 'object') {
    //     return false;
    // }

    // const metadata = obj.metadata;
    // if (typeof metadata.sub !== 'string' ||
    //     typeof metadata.nickname !== 'string' ||
    //     typeof metadata.name !== 'string' ||
    //     typeof metadata.picture !== 'string' ||
    //     typeof metadata.updated_at !== 'string' ||
    //     typeof metadata.email !== 'string' ||
    //     typeof metadata.email_verified !== 'boolean') {
    //     return false;
    // }

    return true;
}

